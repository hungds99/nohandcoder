import OpenAI from "openai";
import { FileService } from "./FileService";
import { CommandService } from "./CommandService";
import {
  FileInfo,
  SearchResult,
  ProjectStructure,
  CommandResult,
} from "../types";
import chalk from "chalk";

export class AIService {
  private openai: OpenAI;
  private fileService: FileService;
  private commandService: CommandService;

  constructor(workspaceRoot: string) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.fileService = new FileService(workspaceRoot);
    this.commandService = new CommandService(workspaceRoot);
  }

  private getTools(): OpenAI.Chat.ChatCompletionTool[] {
    return [
      {
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
      },
      {
        type: "function" as const,
        function: {
          name: "searchFiles",
          description: "Search for text in files",
          parameters: {
            type: "object",
            properties: {
              pattern: {
                type: "string",
                description:
                  "File pattern to search in (e.g., '*.ts' or '**/*')",
              },
              text: {
                type: "string",
                description: "Text to search for",
              },
            },
            required: ["text"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
      {
        type: "function" as const,
        function: {
          name: "analyzeProjectStructure",
          description: "Get project structure information",
          parameters: {
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          strict: true,
        },
      },
      {
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
      },
    ];
  }

  private async getSystemPrompt(): Promise<string> {
    return `You are an AI coding assistant with access to various tools to help with coding tasks.
Your task is to help users with their coding tasks by:
1. Understanding their requests
2. Using appropriate tools to gather information
3. Providing clear and helpful responses
4. Executing necessary commands when needed

When using tools, explain your thought process and why you're using each tool.
Format your responses with:
[THOUGHT] Your reasoning and plan
[TOOL] Tool name and arguments
[RESULT] Tool execution result
[FINAL] Your final response to the user`;
  }

  async handleUserInput(userInput: string): Promise<string> {
    const systemPrompt = await this.getSystemPrompt();
    const tools = this.getTools();

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userInput },
    ];

    console.log(chalk.yellow("\n[AI] Analyzing your request..."));
    const response = await this.openai.chat.completions.create({
      model: process.env.MODEL_NAME || "gpt-4-turbo-preview",
      messages: messages as any,
      tools,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = response.choices[0].message;
    if (!assistantMessage.content) {
      throw new Error("No response from AI");
    }

    let formattedResponse = assistantMessage.content;

    // Handle tool calls if any
    if (assistantMessage.tool_calls) {
      const results = await this.executeToolCalls(assistantMessage.tool_calls);

      // Add tool results to the response
      for (const result of results) {
        const toolIndex = formattedResponse.indexOf(`[TOOL]${result.tool}`);
        if (toolIndex !== -1) {
          const nextSectionIndex = formattedResponse.indexOf(
            "[",
            toolIndex + 1
          );
          const insertPosition =
            nextSectionIndex !== -1
              ? nextSectionIndex
              : formattedResponse.length;
          const resultStr = `\n[RESULT] ${JSON.stringify(
            result.result,
            null,
            2
          )}`;
          formattedResponse =
            formattedResponse.slice(0, insertPosition) +
            resultStr +
            formattedResponse.slice(insertPosition);
        }
      }
    }

    // Get final response with tool results
    const finalMessages = [
      ...messages,
      { role: "assistant", content: formattedResponse },
    ];

    const finalResponse = await this.openai.chat.completions.create({
      model: process.env.MODEL_NAME || "gpt-4-turbo-preview",
      messages: finalMessages as any,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return finalResponse.choices[0].message.content || "No response";
  }

  private async executeToolCalls(
    toolCalls: Array<{ function: { name: string; arguments: string } }>
  ): Promise<any[]> {
    const results = [];

    for (const call of toolCalls) {
      try {
        const toolName = call.function.name;
        const args = JSON.parse(call.function.arguments);

        console.log(chalk.blue(`\n[AI] Using tool: ${toolName}`));
        console.log(chalk.gray(`Arguments: ${JSON.stringify(args, null, 2)}`));

        let result;
        switch (toolName) {
          case "readFile":
            result = await this.fileService.readFile(args.filePath);
            console.log(
              chalk.green(
                `Result: File read successfully (${result.size} bytes)`
              )
            );
            break;
          case "searchFiles":
            result = await this.fileService.searchFiles(
              args.pattern || "",
              args.text
            );
            console.log(chalk.green(`Result: Found ${result.length} matches`));
            break;
          case "analyzeProjectStructure":
            result = await this.fileService.analyzeProjectStructure();
            console.log(
              chalk.green(
                `Result: Project analyzed (${result.totalFiles} files)`
              )
            );
            break;
          case "executeCommand":
            result = await this.commandService.executeCommand(args.command);
            console.log(
              chalk.green(
                `Result: Command executed ${
                  result.success ? "successfully" : "with errors"
                }`
              )
            );
            break;
          default:
            throw new Error(`Unknown tool: ${toolName}`);
        }
        results.push({ tool: toolName, success: true, result });
      } catch (error) {
        console.error(
          chalk.red(`Error using tool ${call.function.name}:`),
          error
        );
        results.push({
          tool: call.function.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }
}
