// swift-tools-version:5.6

import Foundation
import PackageDescription

let dir = Context.packageDirectory
var sources = ["src/parser.c"]
if FileManager.default.fileExists(atPath: "\(dir)/src/scanner.c") {
    sources.append("src/scanner.c")
}
let resources: [Resource] = FileManager.default.fileExists(atPath: "\(dir)/queries") ? [.copy("queries")] : []

let package = Package(
    name: "TreeSitterPrisma",
    products: [
        .library(name: "TreeSitterPrisma", targets: ["TreeSitterPrisma"]),
    ],
    dependencies: [
        .package(url: "https://github.com/tree-sitter/swift-tree-sitter", from: "0.25.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterPrisma",
            dependencies: [],
            path: ".",
            sources: sources,
            resources: resources,
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterPrismaTests",
            dependencies: [
                .product(name: "SwiftTreeSitter", package: "swift-tree-sitter"),
                "TreeSitterPrisma",
            ],
            path: "bindings/swift/TreeSitterPrismaTests"
        )
    ],
    cLanguageStandard: .c11
)
