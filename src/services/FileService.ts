import fs from "fs";
import path from "path";
import { FileInfo, SearchResult, ProjectStructure } from "../types";
import chalk from "chalk";

export class FileService {
  private currentDir: string;

  constructor(workspaceRoot: string) {
    this.currentDir = workspaceRoot;
  }

  async readFile(filePath: string): Promise<FileInfo> {
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.currentDir, filePath);
    const content = await fs.promises.readFile(fullPath, "utf-8");
    const stats = await fs.promises.stat(fullPath);
    return {
      path: filePath,
      content,
      size: stats.size,
      modified: stats.mtime,
    };
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.currentDir, filePath);
    await fs.promises.writeFile(fullPath, content, "utf-8");
  }

  async searchFiles(pattern: string, text: string): Promise<SearchResult[]> {
    const searchPattern = pattern || "**/*";
    const results: SearchResult[] = [];
    const files = await this.listFiles(searchPattern);

    for (const file of files) {
      const content = await this.readFile(file);
      const lines = content.content.split("\n");
      lines.forEach((line, index) => {
        if (line.includes(text)) {
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
    const structure: ProjectStructure = {
      totalFiles: 0,
      totalSize: 0,
      directories: [],
      files: [],
    };

    await this.analyzeDirectory(this.currentDir, structure);
    return structure;
  }

  private async analyzeDirectory(
    dir: string,
    structure: ProjectStructure
  ): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(this.currentDir, fullPath);

      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
          structure.directories.push(relativePath);
          await this.analyzeDirectory(fullPath, structure);
        }
      } else {
        const stats = await fs.promises.stat(fullPath);
        structure.totalFiles++;
        structure.totalSize += stats.size;
        structure.files.push({
          path: relativePath,
          size: stats.size,
          modified: stats.mtime,
        });
      }
    }
  }

  async getCurrentDirectory(): Promise<string> {
    return this.currentDir;
  }

  async listDirectory(): Promise<{ files: string[]; directories: string[] }> {
    const entries = await fs.promises.readdir(this.currentDir, {
      withFileTypes: true,
    });
    const files: string[] = [];
    const directories: string[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        directories.push(entry.name);
      } else {
        files.push(entry.name);
      }
    }

    return { files, directories };
  }

  private async listFiles(pattern: string): Promise<string[]> {
    const files: string[] = [];
    await this.listFilesRecursive(this.currentDir, pattern, files);
    return files;
  }

  private async listFilesRecursive(
    dir: string,
    pattern: string,
    files: string[]
  ): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(this.currentDir, fullPath);

      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
          await this.listFilesRecursive(fullPath, pattern, files);
        }
      } else if (this.matchesPattern(relativePath, pattern)) {
        files.push(relativePath);
      }
    }
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Simple glob pattern matching
    const regex = new RegExp(
      "^" +
        pattern
          .replace(/\./g, "\\.")
          .replace(/\*/g, ".*")
          .replace(/\?/g, ".")
          .replace(/\[/g, "[")
          .replace(/\]/g, "]") +
        "$"
    );
    return regex.test(filePath);
  }
}
