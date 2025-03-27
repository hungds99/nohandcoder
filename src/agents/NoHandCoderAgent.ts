import chalk from "chalk";
import OpenAI from "openai";
import { AnalyzeProjectTool, ReadFileTool, SearchFilesTool } from "../tools";

export class NoHandCoderAgent {
  private openai: OpenAI;
  private tools: Array<{
    instance: any;
    definition: OpenAI.Chat.ChatCompletionTool;
  }>;

  constructor(workspaceRoot: string) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize tools
    this.tools = [
      new ReadFileTool(workspaceRoot),
      new SearchFilesTool(workspaceRoot),
      new AnalyzeProjectTool(workspaceRoot),
    ].map((tool) => ({
      instance: tool,
      definition: tool.getDefinition(),
    }));
  }

  private getTools(): OpenAI.Chat.ChatCompletionTool[] {
    return this.tools.map((tool) => tool.definition);
  }

  private async getSystemPrompt(): Promise<string> {
    return `You are an AI coding assistant with access to various tools to help with coding tasks.
Your task is to help users with their coding tasks by:
1. Understanding their requests
2. Using appropriate tools to gather information
3. Providing clear and helpful responses
4. Executing necessary commands when needed

When using tools, explain your thought process and why you're using each tool.
Provide your responses in a clear, natural way without using any special tags or formatting.

`;
  }

  async handleUserInput(
    userInput: string,
    onStream?: (chunk: string) => void
  ): Promise<string> {
    const systemPrompt = await this.getSystemPrompt();
    const tools = this.getTools();

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userInput },
    ];

    console.log(chalk.yellow("\n[AI] Analyzing your request..."));

    const stream = await this.openai.chat.completions.create({
      model: process.env.MODEL_NAME || "gpt-4-turbo-preview",
      messages: messages as any,
      tools,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    let fullResponse = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        if (onStream) {
          onStream(content);
        } else {
          process.stdout.write(content);
        }
      }
    }
    return fullResponse;
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

        const tool = this.tools.find(
          (t) => t.definition.function.name === toolName
        );
        if (!tool) {
          throw new Error(`Unknown tool: ${toolName}`);
        }

        const result = await tool.instance.execute(args);
        console.log(chalk.green(`Result: Tool executed successfully`));
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
