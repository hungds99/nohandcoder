import inquirer from "inquirer";
import { FileService } from "./services/FileService";
import { CommandService } from "./services/CommandService";
import { AIService } from "./services/AIService";
import chalk from "chalk";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  console.error(chalk.red("Error: OPENAI_API_KEY is not set in .env file"));
  process.exit(1);
}

const fileService = new FileService(process.cwd());
const commandService = new CommandService(process.cwd());
const aiService = new AIService(process.cwd());

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
            message: "What would you like help with?",
            validate: (input) => input.length > 0 || "Query is required",
          },
        ]);

        console.log(chalk.yellow("\n🤔 Processing your request..."));
        const response = await aiService.handleUserInput(query);

        // Parse and display the AI's thought process
        const sections = response.split(/\[(THOUGHT|TOOL|RESULT|FINAL)\]/);

        for (let i = 1; i < sections.length; i += 2) {
          const type = sections[i];
          const content = sections[i + 1].trim();

          if (!content) continue;

          switch (type) {
            case "THOUGHT":
              console.log(chalk.blue("\n💭 [AI Thought Process]"));
              console.log(content);
              break;
            case "TOOL":
              console.log(chalk.cyan("\n🔧 [AI Tool Usage]"));
              console.log(content);
              break;
            case "RESULT":
              console.log(chalk.green("\n📊 [AI Tool Results]"));
              console.log(content);
              break;
            case "FINAL":
              console.log(chalk.yellow("\n✨ [AI Final Response]"));
              console.log(content);
              break;
          }
        }
      } else if (action === "list") {
        const currentDir = await fileService.getCurrentDirectory();
        console.log(chalk.blue("\n📂 Current directory:"));
        console.log(currentDir);

        const { files, directories } = await fileService.listDirectory();

        if (directories.length > 0) {
          console.log(chalk.green("\n📁 Directories:"));
          directories
            .sort()
            .forEach((dir) => console.log(chalk.blue(`  📁 ${dir}`)));
        }

        if (files.length > 0) {
          console.log(chalk.green("\n📄 Files:"));
          files.sort().forEach((file) => console.log(`  📄 ${file}`));
        }

        if (files.length === 0 && directories.length === 0) {
          console.log(chalk.yellow("\nDirectory is empty"));
        }
      } else {
        switch (action) {
          case "read": {
            const { files } = await fileService.listDirectory();

            if (files.length === 0) {
              console.log(
                chalk.yellow("\nNo files found in the current directory")
              );
              break;
            }

            const { file } = await inquirer.prompt([
              {
                type: "list",
                name: "file",
                message: "Select a file to read:",
                choices: files.sort(),
              },
            ]);

            const content = await fileService.readFile(file);
            console.log(chalk.green("\n📄 File content:"));
            console.log(content.content);
            console.log(chalk.gray(`\nFile size: ${content.size} bytes`));
            console.log(
              chalk.gray(`Last modified: ${content.modified.toLocaleString()}`)
            );
            break;
          }

          case "search": {
            const { text } = await inquirer.prompt([
              {
                type: "input",
                name: "text",
                message: "Enter text to search for:",
                validate: (input) =>
                  input.length > 0 || "Search text is required",
              },
            ]);

            console.log(chalk.yellow("\n🔍 Searching..."));
            const results = await fileService.searchFiles("", text);

            if (results.length === 0) {
              console.log(chalk.yellow("\nNo results found"));
            } else {
              console.log(chalk.green(`\n✨ Found ${results.length} matches:`));
              results.forEach((result) => {
                console.log(chalk.blue(`\n📄 ${result.file}:${result.line}`));
                console.log(result.content);
              });
            }
            break;
          }

          case "analyze": {
            const currentDir = await fileService.getCurrentDirectory();
            console.log(chalk.blue("\n📊 Analyzing directory:"));
            console.log(currentDir);

            console.log(chalk.yellow("\n⏳ Analyzing..."));
            const structure = await fileService.analyzeProjectStructure();

            console.log(chalk.green("\n📊 Project Structure:"));
            console.log(`📄 Files: ${structure.totalFiles}`);
            console.log(
              `💾 Total Size: ${(structure.totalSize / 1024).toFixed(2)} KB`
            );

            if (structure.directories.length > 0) {
              console.log(chalk.blue("\n📁 Directories:"));
              structure.directories.sort().forEach((dir) => {
                console.log(chalk.blue(`  📁 ${dir}`));
              });
            }

            if (structure.files.length > 0) {
              console.log(chalk.green("\n📄 Files:"));
              structure.files
                .sort((a, b) => a.path.localeCompare(b.path))
                .forEach((file) => {
                  console.log(
                    `  📄 ${file.path} (${(file.size / 1024).toFixed(2)} KB)`
                  );
                });
            }
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

            console.log(chalk.yellow("\n⚡ Executing command..."));
            const result = await commandService.executeCommand(command);

            if (result.success) {
              if (result.output.trim()) {
                console.log(chalk.green("\n📝 Command output:"));
                console.log(result.output);
              }
              if (result.error && result.error.trim()) {
                console.log(chalk.yellow("\n⚠️ Command stderr:"));
                console.log(result.error);
              }
              if (!result.output.trim() && !result.error?.trim()) {
                console.log(
                  chalk.green("\n✅ Command executed successfully (no output)")
                );
              }
            } else {
              console.error(chalk.red("\n❌ Command failed:"), result.error);
            }
            break;
          }
        }
      }
    } catch (error) {
      console.error(
        chalk.red("\n❌ Error:"),
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }

    console.log("\n" + chalk.gray("Press Enter to continue..."));
    await inquirer.prompt([{ type: "input", name: "continue", message: "" }]);
    console.clear();
  }
}

main().catch((error) => {
  console.error(chalk.red("\n❌ Fatal error:"), error);
  process.exit(1);
});
