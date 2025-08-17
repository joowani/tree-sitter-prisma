import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import textwrap
import unittest


WORKFLOW = Path(__file__).resolve().parent.parent / ".github/workflows/publish.yml"
ROOT = WORKFLOW.parent.parent.parent


def selection_script():
    workflow = WORKFLOW.read_text()
    step = workflow.index("      - name: Choose the commit to release\n")
    start = workflow.index("        run: |\n", step) + len("        run: |\n")
    end = workflow.index("\n      - name:", start)
    return textwrap.dedent(workflow[start:end])


class TestReleaseSource(unittest.TestCase):
    # noinspection SpellCheckingInspection
    @staticmethod
    def choose_commit(registry_status="404", tag_status="200", tag_commit="old-commit", curl_status="0"):
        stubs = r'''
curl() {
    printf '%s' "$REGISTRY_STATUS"
    return "$CURL_STATUS"
}
gh() {
    case "$*" in
        "api --include repos/example/prisma/git/ref/tags/v0.1.0")
            printf 'HTTP/2.0 %s response\n' "$TAG_STATUS"
            [[ "$TAG_STATUS" == 200 ]]
            ;;
        "api repos/example/prisma/commits/v0.1.0 --jq .sha")
            printf '%s\n' "$TAG_COMMIT"
            ;;
        *) echo "unexpected GitHub request: $*" >&2; return 1 ;;
    esac
}
'''
        with tempfile.TemporaryDirectory(prefix="prisma-release-test-") as directory:
            output = Path(directory) / "output"
            output.touch()
            env = {
                **os.environ,
                "VERSION": "0.1.0",
                "GITHUB_SHA": "new-commit",
                "GH_REPO": "example/prisma",
                "GITHUB_OUTPUT": str(output),
                "REGISTRY_STATUS": registry_status,
                "TAG_STATUS": tag_status,
                "TAG_COMMIT": tag_commit,
                "CURL_STATUS": curl_status,
            }
            result = subprocess.run(
                ["bash", "-euo", "pipefail", "-c", stubs + selection_script()],
                env=env,
                capture_output=True,
                text=True,
                timeout=10,
            )
            values = dict(line.split("=", 1) for line in output.read_text().splitlines())
        return result, values

    def test_reuses_existing_tag_even_when_crate_is_unpublished(self):
        for registry_status in ("200", "404"):
            for tag_commit in ("old-commit", "new-commit"):
                with self.subTest(registry_status=registry_status, tag_commit=tag_commit):
                    result, values = self.choose_commit(registry_status=registry_status, tag_commit=tag_commit)
                    self.assertEqual(result.returncode, 0, result.stderr)
                    self.assertEqual(values, {"sha": tag_commit, "tag": "keep"})

    def test_selects_current_commit_for_a_new_version(self):
        result, values = self.choose_commit(tag_status="404")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(values, {"sha": "new-commit", "tag": "create"})

    def test_rejects_published_version_without_a_tag(self):
        result, values = self.choose_commit(registry_status="200", tag_status="404")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(values, {})

    def test_stops_when_release_state_cannot_be_verified(self):
        for failure in ({"registry_status": "500"}, {"tag_status": "500"}, {"curl_status": "7"}):
            with self.subTest(failure=failure):
                result, values = self.choose_commit(**failure)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(values, {})


class TestReleaseVersions(unittest.TestCase):
    def test_rejects_a_mismatched_manifest_before_publishing(self):
        manifests = [
            "Cargo.toml", "pyproject.toml", "package.json", "package-lock.json",
            "tree-sitter.json", "Makefile", "CMakeLists.txt", "build.zig.zon",
        ]
        version = re.search(r'^version = "([^"]+)"', (ROOT / "Cargo.toml").read_text(), re.MULTILINE).group(1)
        with tempfile.TemporaryDirectory(prefix="prisma-version-test-") as directory:
            fixture = Path(directory)
            (fixture / "scripts").mkdir()
            shutil.copy2(ROOT / "scripts/publish", fixture / "scripts/publish")
            for manifest in manifests:
                shutil.copy2(ROOT / manifest, fixture / manifest)

            def check():
                return subprocess.run(
                    ["bash", str(fixture / "scripts/publish"), "--check", version],
                    capture_output=True, text=True, timeout=10,
                )

            result = check()
            self.assertEqual(result.returncode, 0, result.stderr)
            for manifest in manifests:
                with self.subTest(manifest=manifest):
                    target = fixture / manifest
                    original = target.read_text()
                    target.write_text(original.replace(version, "9.9.9", 1))
                    result = check()
                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn(manifest, result.stderr)
                    target.write_text(original)


if __name__ == "__main__":
    unittest.main()
