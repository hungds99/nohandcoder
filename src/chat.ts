import inquirer from "inquirer";
import { FileService } from "./services/FileService";
import { CommandService } from "./services/CommandService";
import { AIService } from "./services/AIService";
import chalk from "chalk";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const fileService = new FileService(process.cwd());
const commandService = new CommandService(process.cwd());
const aiService = new AIService(process.cwd());

async function main() {
  console.log(chalk.blue("Welcome to AI Code Agent!"));
  console.log(chalk.gray('Type "exit" to quit\n'));

  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices: [
          { name: "Ask AI Assistant", value: "ai" },
          { name: "Read a file", value: "read" },
          { name: "Search in files", value: "search" },
          { name: "Analyze project structure", value: "analyze" },
          { name: "Execute command", value: "exec" },
          { name: "Exit", value: "exit" },
        ],
      },
    ]);

    if (action === "exit") {
      console.log(chalk.green("\nGoodbye!"));
      break;
    }

    try {
      if (action === "ai") {
        const { query } = await inquirer.prompt([
          {
            type: "input",
            name: "query",
            message: "What would you like help with?",
            validate: (input) => input.length > 0 || "Query is required",
          },
        ]);

        console.log(chalk.yellow("\nThinking..."));
        const response = await aiService.handleUserInput(query);
        console.log(chalk.green("\nAI Response:"));
        console.log(response);
      } else {
        switch (action) {
          case "read": {
            const { file } = await inquirer.prompt([
              {
                type: "input",
                name: "file",
                message: "Enter file path:",
                validate: (input) =>
                  input.length > 0 || "File path is required",
              },
            ]);

            const content = await fileService.readFile(file);
            console.log(chalk.green("\nFile content:"));
            console.log(content.content);
            break;
          }

          case "search": {
            const { pattern, text } = await inquirer.prompt([
              {
                type: "input",
                name: "pattern",
                message: 'Enter file pattern (e.g., "**/*.ts"):',
                default: "**/*.ts",
              },
              {
                type: "input",
                name: "text",
                message: "Enter text to search for:",
                validate: (input) =>
                  input.length > 0 || "Search text is required",
              },
            ]);

            const results = await fileService.searchFiles(pattern, text);
            console.log(chalk.green("\nSearch results:"));
            results.forEach((result) => {
              console.log(chalk.blue(`${result.file}:${result.line}`));
              console.log(result.content);
            });
            break;
          }

          case "analyze": {
            const structure = await fileService.analyzeProjectStructure();
            console.log(chalk.green("\nProject Structure:"));
            console.log("Files:", structure.totalFiles);
            console.log(
              "Total Size:",
              (structure.totalSize / 1024).toFixed(2),
              "KB"
            );
            console.log("\nDirectories:");
            structure.directories.forEach((dir) =>
              console.log(chalk.blue(dir))
            );
            break;
          }

          case "exec": {
            const { command } = await inquirer.prompt([
              {
                type: "input",
                name: "command",
                message: "Enter command to execute:",
                validate: (input) => input.length > 0 || "Command is required",
              },
            ]);

            const result = await commandService.executeCommand(command);
            if (result.success) {
              console.log(chalk.green("\nCommand output:"));
              console.log(result.output);
              if (result.error) {
                console.log(chalk.yellow("\nCommand stderr:"));
                console.log(result.error);
              }
            } else {
              console.error(chalk.red("\nCommand failed:"), result.error);
            }
            break;
          }
        }
      }
    } catch (error) {
      console.error(
        chalk.red("\nError:"),
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }

    console.log("\n" + chalk.gray("Press Enter to continue..."));
    await inquirer.prompt([{ type: "input", name: "continue", message: "" }]);
  }
}

main().catch((error) => {
  console.error(chalk.red("Fatal error:"), error);
  process.exit(1);
});
