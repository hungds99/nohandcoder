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
    return `You are an AI coding assistant with access to various tools to help with coding tasks.
Your task is to help users with their coding tasks by:
1. Understanding their requests and maintaining context from previous messages
2. Using appropriate tools to gather information when needed
3. Providing clear, helpful, and natural responses
4. Executing necessary commands when required

When using tools, explain your thought process and why you're using each tool.
Provide your responses in a clear, conversational way without using any special tags or formatting.
Keep your responses concise but informative.

Remember to:
- Maintain context from previous messages
- Be proactive in suggesting relevant tools or actions
- Ask clarifying questions when needed
- Provide code examples when appropriate
- Explain your reasoning when making changes

`;
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

  async handleUserInput(
    userInput: string,
    onStream?: (chunk: string) => void
  ): Promise<string> {
    const systemPrompt = await this.getSystemPrompt();
    const tools = this.getTools();

    // Add user message to history
    this.conversationHistory.push({ role: "user", content: userInput });

    // Prepare messages with history
    const messages = [
      { role: "system", content: systemPrompt },
      ...this.conversationHistory,
    ];

    let fullResponse = "";
    let currentToolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[] = [];

    const stream = await this.openai.chat.completions.create({
      model: process.env.MODEL_NAME || "gpt-4-turbo-preview",
      messages: messages as any,
      tools,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      const toolCalls = chunk.choices[0]?.delta?.tool_calls || [];

      if (content) {
        fullResponse += content;
        if (onStream) {
          onStream(content);
        } else {
          process.stdout.write(content);
        }
      }

      // Handle tool calls
      for (const toolCall of toolCalls) {
        if (toolCall.index !== undefined) {
          if (!currentToolCalls[toolCall.index]) {
            currentToolCalls[toolCall.index] = {
              id: toolCall.id || "",
              type: "function",
              function: {
                name: toolCall.function?.name || "",
                arguments: toolCall.function?.arguments || "",
              },
            };
          } else if (toolCall.function?.arguments) {
            currentToolCalls[toolCall.index].function.arguments +=
              toolCall.function.arguments;
          }
        }
      }
    }

    // Execute tool calls if any
    if (currentToolCalls.length > 0) {
      const toolResults = await Promise.all(
        currentToolCalls.map((toolCall) => this.executeToolCall(toolCall))
      );

      // Add tool results to conversation history
      this.conversationHistory.push({
        role: "assistant",
        content: fullResponse,
        tool_calls: currentToolCalls,
      });

      // Add tool results to conversation history
      this.conversationHistory.push({
        role: "tool",
        content: JSON.stringify(toolResults),
        tool_call_id: currentToolCalls[0].id,
      });

      // Get final response from model
      const finalResponse = await this.openai.chat.completions.create({
        model: process.env.MODEL_NAME || "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...this.conversationHistory,
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const finalContent = finalResponse.choices[0]?.message?.content || "";
      fullResponse += finalContent;
      if (onStream) {
        onStream(finalContent);
      } else {
        process.stdout.write(finalContent);
      }
    }

    // Add assistant's response to history
    this.conversationHistory.push({ role: "assistant", content: fullResponse });

    return fullResponse;
  }
}
