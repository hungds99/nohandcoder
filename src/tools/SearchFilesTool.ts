import { OpenAI } from "openai";
import { BaseTool } from "../core/BaseTool";
import fs from "fs";
import path from "path";
import { SearchResult } from "../types";
import { glob } from "glob";
import chalk from "chalk";

export class SearchFilesTool implements BaseTool {
  constructor(private workspaceRoot: string) {}

  getDefinition(): OpenAI.Chat.ChatCompletionTool {
    return {
      type: "function" as const,
      function: {
        name: "searchFiles",
        description: "Search for text in files",
        parameters: {
          type: "object",
          properties: {
            pattern: {
              type: "string",
              description: "Glob pattern to match files (e.g. '**/*.ts')",
            },
            text: {
              type: "string",
              description: "Text to search for in files",
            },
          },
          required: ["pattern", "text"],
          additionalProperties: false,
        },
        strict: true,
      },
    };
  }

  async execute(args: {
    pattern?: string;
    text: string;
  }): Promise<SearchResult[]> {
    console.log(chalk.blue("Searching files...", args.pattern, args.text));
    const searchPattern = args.pattern || "**/*";
    const results: SearchResult[] = [];
    const files = await glob(searchPattern, { cwd: this.workspaceRoot });

    for (const file of files) {
      const fullPath = path.join(this.workspaceRoot, file);
      const content = await fs.promises.readFile(fullPath, "utf-8");
      const lines = content.split("\n");
      lines.forEach((line, index) => {
        if (line.includes(args.text)) {
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
}
