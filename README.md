# Workers AI Chat

A minimal chat UI powered by Cloudflare Workers AI. The React frontend sends messages to a Cloudflare Worker endpoint (`/chat`), which calls a Workers AI text model and returns a concise response.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cf-jongsik/workers-ai-chat)

## Features

- **Chat UI** with `@chatui/core`
- **Cloudflare Worker** handles `POST /chat`
- **Workers AI** model `@cf/openai/gpt-oss-120b`
- **Vite + React (TS)** dev/build tooling

## Prerequisites

- Node.js 18+ and npm
- Cloudflare account with Workers enabled
- Workers AI enabled on your account (no API key required when using the `AI` binding)

## Getting Started

1. Install deps
   ```bash
   npm install
   ```
2. Login to Cloudflare (once per machine)
   ```bash
   npx wrangler login
   ```
3. Deploy
   ```bash
   npm run deploy
   ```

## How it works

- Frontend (`src/ChatPage.tsx`)
  - Sends `POST /chat` with JSON `{ messages, prompt }`.
  - Renders assistant responses in the chat list.
- Worker (`worker/index.ts`)
  - Parses the request, converts chat messages into model input, and calls:
    ```ts
    const response = await ai.run("@cf/openai/gpt-oss-120b", {
      instructions: "you are a concise assistant",
      input: JSON.stringify(inputJSON),
    });
    ```
  - Returns the AI output as JSON.

## Project Structure

```
.
├─ src/
│  ├─ ChatPage.tsx        # Chat UI and /chat client
│  ├─ App.tsx, main.tsx   # App bootstrap
│  ├─ types.d.ts          # UI message types
├─ worker/
│  ├─ index.ts            # Cloudflare Worker (POST /chat)
│  └─ types.d.ts
├─ index.html             # App entry
├─ vite.config.ts         # Vite + Cloudflare plugin
├─ wrangler.jsonc         # Worker + AI binding config
├─ eslint.config.js
├─ tsconfig*.json
├─ package.json
└─ pnpm-lock.yaml
```

## Notes

- The Worker currently uses `@cf/openai/gpt-oss-120b`. You can swap to other Workers AI text models; see Cloudflare docs for available models and input schemas.
- Responses are intentionally concise by design.

---
