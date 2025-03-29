import { OpenAI } from "openai";
import { BaseTool } from "../core/BaseTool";
import fs from "fs";
import path from "path";
import chalk from "chalk";
export class EditFileTool implements BaseTool {
  constructor(private workspaceRoot: string) {}

  getDefinition(): OpenAI.Chat.ChatCompletionTool {
    return {
      type: "function" as const,
      function: {
        name: "editFile",
        description: "Edit the contents of a file",
        parameters: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description:
                "Path to the file to edit (relative to current directory)",
            },
            content: {
              type: "string",
              description: "The new content to write to the file",
            },
          },
          required: ["filePath", "content"],
          additionalProperties: false,
        },
        strict: true,
      },
    };
  }

  async execute(args: { filePath: string; content: string }): Promise<any> {
    console.log(chalk.blue("\nEditing file...", args.filePath));
    const fullPath = path.isAbsolute(args.filePath)
      ? args.filePath
      : path.join(this.workspaceRoot, args.filePath);
    await fs.promises.writeFile(fullPath, args.content, "utf-8");

    return {
      success: true,
      message: `File ${args.filePath} updated successfully`,
    };
  }
}
