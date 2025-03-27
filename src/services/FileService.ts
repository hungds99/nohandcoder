import fs from "fs";
import path from "path";
import { glob } from "glob";
import { FileInfo, SearchResult, ProjectStructure } from "../types";

export class FileService {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  async readFile(filePath: string): Promise<FileInfo> {
    const fullPath = path.join(this.workspaceRoot, filePath);
    const content = await fs.promises.readFile(fullPath, "utf-8");
    const stats = await fs.promises.stat(fullPath);

    return {
      path: filePath,
      content,
      size: stats.size,
    };
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.workspaceRoot, filePath);
    await fs.promises.writeFile(fullPath, content, "utf-8");
  }

  async searchFiles(
    pattern: string,
    searchText: string
  ): Promise<SearchResult[]> {
    const files = await glob(pattern, { cwd: this.workspaceRoot });
    const results: SearchResult[] = [];

    for (const file of files) {
      const content = await this.readFile(file);
      const lines = content.content.split("\n");

      lines.forEach((line, index) => {
        if (line.includes(searchText)) {
          results.push({
            file,
            line: index + 1,
            content: line.trim(),
          });
        }
      });
    }

    return results;
  }

  async analyzeProjectStructure(): Promise<ProjectStructure> {
    const files = await glob("**/*", {
      cwd: this.workspaceRoot,
      ignore: ["node_modules/**", "dist/**"],
    });

    const directories = new Set<string>();
    let totalSize = 0;

    for (const file of files) {
      const fullPath = path.join(this.workspaceRoot, file);
      const stats = await fs.promises.stat(fullPath);

      if (stats.isDirectory()) {
        directories.add(file);
      } else {
        totalSize += stats.size;
      }
    }

    return {
      files: files.filter((f: string) => !directories.has(f)),
      directories: Array.from(directories),
      totalFiles: files.length - directories.size,
      totalSize,
    };
  }
}
