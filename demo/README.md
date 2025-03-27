# Demo Project

This is a demo project to test the AI Code Agent's features. It includes:

- A simple calculator implementation in TypeScript
- Unit tests using Jest
- Various file types and structures

## Project Structure

```
demo/
├── src/
│   └── calculator.ts      # Calculator implementation
├── tests/
│   └── calculator.test.ts # Calculator tests
├── package.json          # Project dependencies
├── tsconfig.json        # TypeScript configuration
└── jest.config.js       # Jest configuration
```

## Testing with AI Code Agent

You can use the following commands to test different features of the AI Code Agent:

1. Read a file:

```bash
npm run dev -- read demo/src/calculator.ts
```

2. Search for text:

```bash
npm run dev -- search "demo/**/*.ts" "Calculator"
```

3. Analyze project structure:

```bash
npm run dev -- analyze
```

4. Execute tests:

```bash
npm run dev -- exec "cd demo && npm test"
```
