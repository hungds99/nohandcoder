import { OpenAI } from "openai";
import { BaseTool } from "../core/BaseTool";
import fs from "fs";
import path from "path";
import { ProjectStructure } from "../types";
import { glob } from "glob";
import chalk from "chalk";

export class AnalyzeProjectTool implements BaseTool {
  constructor(private workspaceRoot: string) {}

  private async getIgnorePatterns(): Promise<string[]> {
    const gitignorePath = path.join(this.workspaceRoot, ".gitignore");
    try {
      const content = await fs.promises.readFile(gitignorePath, "utf-8");
      return content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .map((pattern) => `**/${pattern}/**`);
    } catch (error) {
      console.warn(
        chalk.yellow(
          "Warning: .gitignore file not found or cannot be read. Using default ignore patterns."
        )
      );
      return ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/.env*"];
    }
  }

  getDefinition(): OpenAI.Chat.ChatCompletionTool {
    return {
      type: "function" as const,
      function: {
        name: "analyzeProject",
        description: "Analyze the project structure",
        parameters: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        strict: true,
      },
    };
  }

  async execute(): Promise<ProjectStructure> {
    console.log(chalk.blue("\nAnalyzing project structure..."));

    const ignorePatterns = await this.getIgnorePatterns();
    const files = await glob("**/*", {
      cwd: this.workspaceRoot,
      ignore: ignorePatterns,
      dot: false,
    });

    const structure: ProjectStructure = {
      files: [],
      directories: [],
      totalFiles: 0,
      totalSize: 0,
    };

    for (const file of files) {
      console.log(chalk.green("\nAnalyzing file:", file));
      const fullPath = path.join(this.workspaceRoot, file);
      const stats = await fs.promises.stat(fullPath);

      if (stats.isDirectory()) {
        structure.directories.push(file);
      } else {
        structure.files.push({
          path: file,
          size: stats.size,
          modified: stats.mtime,
        });
        structure.totalFiles++;
        structure.totalSize += stats.size;
      }
    }

    return structure;
  }
}
