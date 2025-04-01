#!/usr/bin/env node

import { Command } from "commander";
import { config } from "dotenv";
import { chat } from "./chat";
import { version } from "../package.json";

// Load environment variables
config();

const program = new Command();

program
  .name("nohandcoder")
  .description("AI-powered code editing and project analysis tool")
  .version(version);

program
  .command("chat")
  .description("Start an interactive chat session")
  .action(async () => {
    try {
      await chat();
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

program.parse();
