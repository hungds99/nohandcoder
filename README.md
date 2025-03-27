# AI Code Agent

An intelligent coding assistant powered by OpenAI's GPT-4 that helps you navigate, analyze, and manage your codebase through natural language interactions.

## Features

- 🤖 **AI-Powered Assistance**: Get help with coding tasks through natural language conversations
- 📂 **File Operations**: Read, search, and analyze files in your project
- 📊 **Project Analysis**: Get insights about your project structure and organization
- ⚡ **Command Execution**: Execute shell commands safely through the AI interface
- 🎨 **Beautiful CLI Interface**: User-friendly command-line interface with colorful output
- 🔒 **Secure**: API keys and sensitive data are handled securely through environment variables

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- OpenAI API key

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/ai-code-agent.git
cd ai-code-agent
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file:

```bash
cp .env.example .env
```

4. Add your OpenAI API key to the `.env` file:

```
OPENAI_API_KEY=your_api_key_here
MODEL_NAME=gpt-4-turbo-preview
```

## Usage

Start the chat interface:

```bash
npm run chat
```

### Available Commands

1. **💬 Ask AI Assistant**

   - Ask questions about your codebase
   - Get help with coding tasks
   - Request code analysis or explanations

2. **📂 List current directory**

   - View files and folders in the current directory
   - Navigate through your project structure

3. **📄 Read a file**

   - Select and view file contents
   - See file metadata (size, last modified)

4. **🔍 Search in files**

   - Search for text across your project
   - Find specific code patterns or functions

5. **📊 Analyze project structure**

   - Get an overview of your project
   - View file counts and sizes
   - See directory organization

6. **⚡ Execute command**
   - Run shell commands safely
   - Get command output and errors

### Example Interactions

```
🤖 Welcome to AI Code Agent!
Type "exit" to quit

? What would you like to do? 💬 Ask AI Assistant
? What would you like help with? Help me understand the project structure

[AI] Analyzing your request...

💭 [AI Thought Process]
I'll analyze the project structure to provide a comprehensive overview.

🔧 [AI Tool Usage]
analyzeProjectStructure()

📊 [AI Tool Results]
{
  "totalFiles": 42,
  "totalSize": 1024,
  "directories": ["src", "tests", "docs"],
  "files": [...]
}

✨ [AI Final Response]
Your project consists of 42 files...
```

## Project Structure

```
ai-code-agent/
├── src/
│   ├── services/
│   │   ├── AIService.ts      # OpenAI integration and AI logic
│   │   ├── FileService.ts    # File operations and project analysis
│   │   └── CommandService.ts # Shell command execution
│   ├── types.ts              # TypeScript type definitions
│   └── chat.ts               # CLI interface
├── .env.example              # Example environment variables
├── package.json              # Project dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

## Development

### Building

```bash
npm run build
```

### Running Tests

```bash
npm test
```

### Development Mode

```bash
npm run dev
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for providing the GPT-4 API
- The open-source community for various tools and libraries used in this project
