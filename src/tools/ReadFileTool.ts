import { OpenAI } from "openai";
import { BaseTool } from "../core/BaseTool";
import fs from "fs";
import path from "path";
import { FileInfo } from "../types";
import chalk from "chalk";

export class ReadFileTool implements BaseTool {
  constructor(private workspaceRoot: string) {}

  getDefinition(): OpenAI.Chat.ChatCompletionTool {
    return {
      type: "function" as const,
      function: {
        name: "readFile",
        description: "Read the contents of a file",
        parameters: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description:
                "Path to the file to read (relative to current directory)",
            },
          },
          required: ["filePath"],
          additionalProperties: false,
        },
        strict: true,
      },
    };
  }

  async execute(args: { filePath: string }): Promise<FileInfo> {
    console.log(chalk.blue("\nReading file...", args.filePath));
    const fullPath = path.isAbsolute(args.filePath)
      ? args.filePath
      : path.join(this.workspaceRoot, args.filePath);
    const content = await fs.promises.readFile(fullPath, "utf-8");
    const stats = await fs.promises.stat(fullPath);
    return {
      path: args.filePath,
      content,
      size: stats.size,
      modified: stats.mtime,
    };
  }
}
