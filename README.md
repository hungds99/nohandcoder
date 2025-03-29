# NoHandCoder

Your intelligent coding companion that helps you navigate, analyze, and manage your codebase through simple conversations. Just chat naturally with the AI to get help with your coding tasks!

## What You Can Do

- 🤖 **Chat with AI**: Ask questions about your code and get helpful responses
- 📂 **Browse Files**: Easily navigate through your project files and folders
- 📄 **Read Code**: View and understand your code files
- 🔍 **Search Code**: Find specific code patterns or functions across your project
- 📊 **Project Overview**: Get a clear picture of your project structure
- ⚡ **Run Commands**: Execute commands safely through the AI interface

## Getting Started

1. Install the required software:

   - Node.js (v14 or higher)
   - npm (v6 or higher)

2. Get your OpenAI API key from [OpenAI's website](https://platform.openai.com)

3. Set up the project:

   ```bash
   # Clone the project
   git clone https://github.com/hungds99/nohandcoder.git
   cd nohandcoder

   # Install the project
   npm install

   # Set up your API key
   cp .env.example .env
   ```

4. Add your OpenAI API key to the `.env` file:
   ```
   OPENAI_API_KEY=your_api_key_here
   MODEL_NAME=gpt-4-turbo-preview
   ```

## How to Use

1. Start the chat interface:

   ```bash
   npm run chat
   ```

2. Choose from these options:
   - 💬 **Ask AI Assistant**: Get help with your code
   - 📂 **List Directory**: See what's in your current folder
   - 📄 **Read File**: View any file's contents
   - 🔍 **Search Files**: Find specific code
   - 📊 **Project Structure**: See your project overview
   - ⚡ **Run Commands**: Execute commands safely

## Example Chat

```
🤖 Welcome to NoHandCoder!
Type "exit" to quit

? What would you like to do? 💬 Ask AI Assistant
? What would you like help with? Help me understand the project structure

[AI] Analyzing your request...

✨ [AI Response]
Your project follows a clean architecture with the following structure...
```

## Tips for Best Results

1. **Be Specific**: The more specific your questions, the better the AI can help you
2. **Use Natural Language**: Just ask questions as you would to a human assistant
3. **Explore Features**: Try different commands to discover what the AI can do
4. **Stay in Context**: The AI remembers your conversation, so build on previous questions

## Need Help?

- Type "exit" to quit the chat
- Ask the AI for help with any feature
- Check the project's issues page for known problems

## Contributing

We welcome contributions! Feel free to:

1. Fork the project
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for providing the GPT-4 API
- The open-source community for their valuable contributions
