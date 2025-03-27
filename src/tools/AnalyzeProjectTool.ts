import { OpenAI } from "openai";
import { BaseTool } from "../core/BaseTool";
import fs from "fs";
import path from "path";
import { ProjectStructure } from "../types";
import { glob } from "glob";
import chalk from "chalk";

export class AnalyzeProjectTool implements BaseTool {
  constructor(private workspaceRoot: string) {}

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
    console.log(chalk.blue("Analyzing project structure..."));
    const files = await glob("**/*", { cwd: this.workspaceRoot });
    const structure: ProjectStructure = {
      files: [],
      directories: [],
      totalFiles: 0,
      totalSize: 0,
    };

    for (const file of files) {
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
