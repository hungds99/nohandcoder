import { OpenAI } from "openai";
import { BaseTool } from "../core/BaseTool";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class ExecuteCommandTool implements BaseTool {
  constructor(private workspaceRoot: string) {}

  getDefinition(): OpenAI.Chat.ChatCompletionTool {
    return {
      type: "function" as const,
      function: {
        name: "executeCommand",
        description: "Execute a shell command",
        parameters: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description: "Command to execute",
            },
          },
          required: ["command"],
          additionalProperties: false,
        },
        strict: true,
      },
    };
  }

  async execute(args: { command: string }): Promise<any> {
    try {
      const command = args.command;
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.workspaceRoot,
      });

      return {
        success: true,
        output: stdout,
        error: stderr,
      };
    } catch (error) {
      return {
        success: false,
        output: "",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}
