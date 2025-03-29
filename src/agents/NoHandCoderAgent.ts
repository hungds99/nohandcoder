import chalk from "chalk";
import OpenAI from "openai";
import {
  AnalyzeProjectTool,
  ReadFileTool,
  SearchFilesTool,
  ExecuteCommandTool,
  EditFileTool,
} from "../tools";

export class NoHandCoderAgent {
  private openai: OpenAI;
  private tools: Array<{
    instance: any;
    definition: OpenAI.Chat.ChatCompletionTool;
  }>;
  private conversationHistory: OpenAI.Chat.ChatCompletionMessageParam[];

  constructor(workspaceRoot: string) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize tools
    this.tools = [
      new ReadFileTool(workspaceRoot),
      new SearchFilesTool(workspaceRoot),
      new AnalyzeProjectTool(workspaceRoot),
      new ExecuteCommandTool(workspaceRoot),
      new EditFileTool(workspaceRoot),
    ].map((tool) => ({
      instance: tool,
      definition: tool.getDefinition(),
    }));

    // Initialize conversation history
    this.conversationHistory = [];
  }

  private getTools(): OpenAI.Chat.ChatCompletionTool[] {
    return this.tools.map((tool) => tool.definition);
  }

  private async getSystemPrompt(): Promise<string> {
    return `You are an AI coding assistant with access to various tools to help with coding tasks in the current workspace.

Your task is to help users by following these steps in order:

1. First, analyze the project structure and dependencies using the AnalyzeProjectTool to understand the codebase context
2. Search for relevant files and folders using SearchFilesTool based on the user's request
3. Read the identified files using ReadFileTool to understand the code that needs to be modified
4. Make necessary edits using EditFileTool according to user requirements
5. Execute any required commands using ExecuteCommandTool if needed

For each action you take:
1. Explain why you are using each tool and what information you expect to gather
2. Show the results and explain your findings
3. Describe your planned next steps based on the information gathered
4. Get user confirmation before making any file changes

Remember to:
- Keep track of all files you've examined and changes you've made
- Verify that proposed changes are consistent with the existing codebase
- Consider dependencies and potential side effects of changes
- Ask for clarification if the user's request is ambiguous
- Explain your reasoning for suggested changes
- Provide code examples to illustrate your suggestions
- Maintain context from the conversation history

Always be thorough in your analysis but concise in your responses. Focus on completing the task systematically while keeping the user informed of your progress.`;
  }

  private async executeToolCall(
    toolCall: OpenAI.Chat.ChatCompletionMessageToolCall
  ): Promise<any> {
    const tool = this.tools.find(
      (t) => t.definition.function.name === toolCall.function.name
    );
    if (!tool) {
      throw new Error(`Tool ${toolCall.function.name} not found`);
    }

    const args = JSON.parse(toolCall.function.arguments);
    return await tool.instance.execute(args);
  }

  private async streamResponse(
    stream: AsyncIterable<OpenAI.Chat.ChatCompletionChunk>,
    onStream?: (chunk: string) => void
  ): Promise<{
    content: string;
    toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[];
  }> {
    let content = "";
    const toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[] = [];

    for await (const chunk of stream) {
      const deltaContent = chunk.choices[0]?.delta?.content || "";
      const deltaToolCalls = chunk.choices[0]?.delta?.tool_calls || [];

      if (deltaContent) {
        content += deltaContent;
        if (onStream) {
          onStream(deltaContent);
        } else {
          process.stdout.write(deltaContent);
        }
      }

      // Handle tool calls
      for (const toolCall of deltaToolCalls) {
        if (toolCall.index !== undefined) {
          if (!toolCalls[toolCall.index]) {
            toolCalls[toolCall.index] = {
              id: toolCall.id || "",
              type: "function",
              function: {
                name: toolCall.function?.name || "",
                arguments: toolCall.function?.arguments || "",
              },
            };
          } else if (toolCall.function?.arguments) {
            toolCalls[toolCall.index].function.arguments +=
              toolCall.function.arguments;
          }
        }
      }
    }

    return { content, toolCalls };
  }

  private async executeToolCalls(
    toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[]
  ): Promise<any[]> {
    try {
      return await Promise.all(
        toolCalls.map((toolCall) => this.executeToolCall(toolCall))
      );
    } catch (error) {
      console.error("Error executing tool calls:", error);
      throw new Error(
        `Failed to execute tool calls: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async getModelResponse(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    tools?: OpenAI.Chat.ChatCompletionTool[],
    onStream?: (chunk: string) => void
  ): Promise<{
    content: string;
    toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[];
  }> {
    const stream = await this.openai.chat.completions.create({
      model: process.env.MODEL_NAME || "gpt-4-turbo-preview",
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      ...(tools && { tools, tool_choice: "auto" }),
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    return this.streamResponse(stream, onStream);
  }

  async handleUserInput(
    userInput: string,
    onStream?: (chunk: string) => void
  ): Promise<string> {
    try {
      const systemPrompt = await this.getSystemPrompt();
      const tools = this.getTools();

      // Add user message to history
      this.conversationHistory.push({ role: "user", content: userInput });

      let fullResponse = "";
      let currentMessages = [
        { role: "system", content: systemPrompt },
        ...this.conversationHistory,
      ];

      while (true) {
        // Get response from model
        const { content: modelContent, toolCalls } =
          await this.getModelResponse(
            currentMessages as OpenAI.Chat.ChatCompletionMessageParam[],
            tools,
            onStream
          );

        fullResponse += modelContent;

        // If no tool calls, we're done
        if (!toolCalls || toolCalls.length === 0) {
          break;
        }

        // Execute tool calls
        const toolResults = await this.executeToolCalls(toolCalls);

        // Add tool calls and results to conversation history
        this.conversationHistory.push({
          role: "assistant",
          content: modelContent,
          tool_calls: toolCalls,
        });

        this.conversationHistory.push({
          role: "tool",
          content: JSON.stringify(toolResults),
          tool_call_id: toolCalls[0].id,
        });

        // Update current messages for next iteration
        currentMessages = [
          { role: "system", content: systemPrompt },
          ...this.conversationHistory,
        ];
      }

      // Add final assistant's response to history
      this.conversationHistory.push({
        role: "assistant",
        content: fullResponse,
      });

      // Limit conversation history to prevent memory issues
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = [
          { role: "system", content: systemPrompt },
          ...this.conversationHistory.slice(-19),
        ];
      }

      return fullResponse;
    } catch (error) {
      console.error("Error in handleUserInput:", error);
      throw new Error(
        `Failed to handle user input: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
