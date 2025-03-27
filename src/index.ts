import { Command } from "commander";
import { FileService } from "./services/FileService";
import { CommandService } from "./services/CommandService";
import chalk from "chalk";
import path from "path";

const program = new Command();

program
  .name("ai-code-agent")
  .description("AI agent for code editing, searching, and project analysis")
  .version("1.0.0");

// File reading command
program
  .command("read")
  .description("Read a file")
  .argument("<file>", "file to read")
  .action(async (file) => {
    const fileService = new FileService(process.cwd());
    try {
      const content = await fileService.readFile(file);
      console.log(chalk.green("File content:"));
      console.log(content.content);
    } catch (error) {
      console.error(chalk.red("Error reading file:"), error);
    }
  });

// File search command
program
  .command("search")
  .description("Search for text in files")
  .argument("<pattern>", "file pattern to search in")
  .argument("<text>", "text to search for")
  .action(async (pattern, text) => {
    const fileService = new FileService(process.cwd());
    try {
      const results = await fileService.searchFiles(pattern, text);
      console.log(chalk.green("Search results:"));
      results.forEach((result) => {
        console.log(chalk.blue(`${result.file}:${result.line}`));
        console.log(result.content);
      });
    } catch (error) {
      console.error(chalk.red("Error searching files:"), error);
    }
  });

// Project structure command
program
  .command("analyze")
  .description("Analyze project structure")
  .action(async () => {
    const fileService = new FileService(process.cwd());
    try {
      const structure = await fileService.analyzeProjectStructure();
      console.log(chalk.green("Project Structure:"));
      console.log("Files:", structure.totalFiles);
      console.log("Total Size:", (structure.totalSize / 1024).toFixed(2), "KB");
      console.log("\nDirectories:");
      structure.directories.forEach((dir) => console.log(chalk.blue(dir)));
    } catch (error) {
      console.error(chalk.red("Error analyzing project:"), error);
    }
  });

// Command execution
program
  .command("exec")
  .description("Execute a command")
  .argument("<command>", "command to execute")
  .action(async (command) => {
    const commandService = new CommandService(process.cwd());
    const result = await commandService.executeCommand(command);
    if (result.success) {
      console.log(chalk.green("Command output:"));
      console.log(result.output);
      if (result.error) {
        console.log(chalk.yellow("Command stderr:"));
        console.log(result.error);
      }
    } else {
      console.error(chalk.red("Command failed:"), result.error);
    }
  });

program.parse();
