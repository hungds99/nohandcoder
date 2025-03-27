# AI Code Agent

A TypeScript-based AI agent for code editing, searching, and project analysis.

## Features

- File reading and editing
- Code search across files
- Project structure analysis
- Command execution
- Interactive terminal interface
- AI-powered code assistance

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

4. Add your OpenAI API key to the `.env` file:

```
OPENAI_API_KEY=your_api_key_here
MODEL_NAME=gpt-4-turbo-preview
```

5. Build the project:

```bash
npm run build
```

## Usage

The tool provides two ways to interact:

### 1. Interactive Chat Interface (Recommended)

Run the chat interface:

```bash
npm run chat
```

This will start an interactive session where you can:

- Ask the AI assistant for help with coding tasks
- Read files
- Search for text in files
- Analyze project structure
- Execute commands
- Navigate through options using arrow keys

The AI assistant can:

- Understand natural language requests
- Use available tools to gather information
- Provide helpful responses with context
- Execute necessary commands
- Help with code-related tasks

### 2. Command Line Interface

You can also use the tool directly from the command line:

```bash
# Read a file
npm run dev -- read <file>

# Search for text in files
npm run dev -- search <pattern> <text>

# Analyze project structure
npm run dev -- analyze

# Execute a command
npm run dev -- exec <command>
```

## Development

To run in development mode:

```bash
npm run dev
```

## License

MIT
