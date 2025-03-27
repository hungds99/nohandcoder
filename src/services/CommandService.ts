import { exec } from "child_process";
import { promisify } from "util";
import { CommandResult } from "../types";

const execAsync = promisify(exec);

export class CommandService {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  async executeCommand(command: string): Promise<CommandResult> {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.workspaceRoot,
      });

      return {
        success: true,
        output: stdout,
        error: stderr,
      };
    } catch (error) {
      return {
        success: false,
        output: "",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}
