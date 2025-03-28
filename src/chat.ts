import chalk from "chalk";
import dotenv from "dotenv";
import { NoHandCoderAgent } from "./agents/NoHandCoderAgent";

// Load environment variables
dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  console.error(chalk.red("Error: OPENAI_API_KEY is not set in .env file"));
  process.exit(1);
}

const workspaceRoot = process.cwd();
const aiService = new NoHandCoderAgent(workspaceRoot);

async function main() {
  console.log(chalk.blue("\n🤖 Welcome to AI Code Assistant!"));
  console.log(
    chalk.gray(
      "Let's have a conversation about your code. Type 'exit' or 'quit' to end the conversation.\n"
    )
  );

  while (true) {
    try {
      const userInput = await new Promise<string>((resolve) => {
        process.stdout.write(chalk.cyan("\nYou: "));
        process.stdin.once("data", (data) => {
          resolve(data.toString().trim());
        });
      });

      if (
        userInput.toLowerCase() === "exit" ||
        userInput.toLowerCase() === "quit"
      ) {
        console.log(chalk.green("\n👋 Goodbye!"));
        process.exit(0);
      }

      if (!userInput) continue;

      console.log(chalk.blue("\n🤔 Thinking...\n"));
      await aiService.handleUserInput(userInput, (chunk) => {
        process.stdout.write(chunk);
      });
      console.log("\n");
    } catch (error) {
      console.error(chalk.red("\n❌ Error:"), error);
      console.log("\n");
    }
  }
}

main().catch((error) => {
  console.error(chalk.red("\n❌ Fatal error:"), error);
  process.exit(1);
});
