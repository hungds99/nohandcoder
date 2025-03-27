import { OpenAI } from "openai";

export interface BaseTool {
  getDefinition(): OpenAI.Chat.ChatCompletionTool;
  execute(args: any): Promise<any>;
}
