import OpenAI from "openai";
import { FileService } from "./FileService";
import { CommandService } from "./CommandService";
import {
  FileInfo,
  SearchResult,
  ProjectStructure,
  CommandResult,
} from "../types";

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

  private async getSystemPrompt(): Promise<string> {
    return `You are an AI coding assistant with access to the following tools:
1. File operations (read, write, search)
2. Project structure analysis
3. Command execution

Your task is to help users with their coding tasks by:
1. Understanding their requests
2. Using appropriate tools to gather information
3. Providing clear and helpful responses
4. Executing necessary commands when needed

Always explain your actions and provide context for your responses.`;
  }

  private async getToolDescriptions(): Promise<string> {
    return `Available tools:
1. readFile(filePath: string): Read the contents of a file
2. searchFiles(pattern: string, text: string): Search for text in files
3. analyzeProjectStructure(): Get project structure information
4. executeCommand(command: string): Execute a shell command

Use these tools to help users with their tasks.`;
  }

  async handleUserInput(userInput: string): Promise<string> {
    const systemPrompt = await this.getSystemPrompt();
    const toolDescriptions = await this.getToolDescriptions();

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "system", content: toolDescriptions },
      { role: "user", content: userInput },
    ];

    const response = await this.openai.chat.completions.create({
      model: process.env.MODEL_NAME || "gpt-4-turbo-preview",
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = response.choices[0].message.content;
    if (!assistantMessage) {
      throw new Error("No response from AI");
    }

    // Parse the AI's response and execute necessary tools
    const toolCalls = this.parseToolCalls(assistantMessage);
    const results = await this.executeToolCalls(toolCalls);

    // Get final response with tool results
    const finalMessages = [
      ...messages,
      { role: "assistant", content: assistantMessage },
      {
        role: "system",
        content: `Tool execution results: ${JSON.stringify(results)}`,
      },
    ];

    const finalResponse = await this.openai.chat.completions.create({
      model: process.env.MODEL_NAME || "gpt-4-turbo-preview",
      messages: finalMessages as any,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return finalResponse.choices[0].message.content || "No response";
  }

  private parseToolCalls(
    message: string
  ): Array<{ tool: string; args: any[] }> {
    const toolCalls: Array<{ tool: string; args: any[] }> = [];
    const toolRegex = /\[TOOL\](\w+)\s*\((.*?)\)\[/g;
    let match;

    while ((match = toolRegex.exec(message)) !== null) {
      const tool = match[1];
      const argsStr = match[2];
      const args = argsStr.split(",").map((arg) => arg.trim());
      toolCalls.push({ tool, args });
    }

    return toolCalls;
  }

  private async executeToolCalls(
    toolCalls: Array<{ tool: string; args: any[] }>
  ): Promise<any[]> {
    const results = [];

    for (const call of toolCalls) {
      try {
        let result;
        switch (call.tool) {
          case "readFile":
            result = await this.fileService.readFile(call.args[0]);
            break;
          case "searchFiles":
            result = await this.fileService.searchFiles(
              call.args[0],
              call.args[1]
            );
            break;
          case "analyzeProjectStructure":
            result = await this.fileService.analyzeProjectStructure();
            break;
          case "executeCommand":
            result = await this.commandService.executeCommand(call.args[0]);
            break;
          default:
            throw new Error(`Unknown tool: ${call.tool}`);
        }
        results.push({ tool: call.tool, success: true, result });
      } catch (error) {
        results.push({
          tool: call.tool,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }
}
