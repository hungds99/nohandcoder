import chalk from "chalk";
import dotenv from "dotenv";
import inquirer from "inquirer";
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
  console.log(chalk.blue("\n🤖 Welcome to AI Code Agent!"));
  console.log(chalk.gray('Type "exit" to quit\n'));

  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices: [
          { name: "💬 Ask AI Assistant", value: "ai" },
          { name: "📂 List current directory", value: "list" },
          { name: "📄 Read a file", value: "read" },
          { name: "🔍 Search in files", value: "search" },
          { name: "📊 Analyze project structure", value: "analyze" },
          { name: "⚡ Execute command", value: "exec" },
          { name: "👋 Exit", value: "exit" },
        ],
      },
    ]);

    if (action === "exit") {
      console.log(chalk.green("\n👋 Goodbye!"));
      break;
    }

    try {
      if (action === "ai") {
        const { query } = await inquirer.prompt([
          {
            type: "input",
            name: "query",
            message: "What would you like to ask?",
          },
        ]);

        console.log(chalk.blue("\n🤔 Thinking...\n"));
        await aiService.handleUserInput(query, (chunk) => {
          process.stdout.write(chunk);
        });
        console.log("\n");
      }
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
