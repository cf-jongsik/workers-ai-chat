# Workers AI Chat

A modern, real-time chat application powered by Cloudflare Workers AI and Durable Objects. Built with React Router, TypeScript, and Tailwind CSS for a seamless, responsive chat experience.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cf-jongsik/workers-ai-chat)

## Features

- **Real-time Chat**: WebSocket-powered communication with instant message delivery
- **AI-Powered**: Integrated with Cloudflare Workers AI using the `@cf/openai/gpt-oss-120b` model
- **Persistent Conversations**: Chat history stored in Durable Objects for continuity across sessions
- **Modern UI**: Beautiful, responsive interface with Tailwind CSS and smooth animations
- **Accessibility**: Full ARIA support and keyboard navigation
- **Error Handling**: Comprehensive error handling with user-friendly feedback
- **Authentication**: Optional Cloudflare Access integration for secure access
- **Rich Markdown**: Support for code blocks, tables, links, and formatted text

## Tech Stack

- **Frontend**: React Router v7, TypeScript, Tailwind CSS
- **Backend**: Cloudflare Workers, Durable Objects
- **AI**: Cloudflare Workers AI (`@cf/openai/gpt-oss-120b`)
- **Real-time**: WebSocket connections via Agents framework
- **Markdown**: Rich message rendering with `markdown-to-jsx`
- **Build Tools**: Vite, React Router Dev

## Prerequisites

- Node.js 18+ and pnpm
- Cloudflare account with Workers enabled
- Workers AI enabled on your account (no API key required when using the `AI` binding)

## Getting Started

1. Clone the repository:

   ```bash
   git clone <your-repo-url>
   cd workers-ai-chat
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Login to Cloudflare (once per machine):

   ```bash
   npx wrangler login
   ```

4. Set up environment variables:

   ```bash
   cp .dev.vars.example .dev.vars
   # Edit .dev.vars with your Cloudflare credentials
   ```

5. Set up Wrangler secrets (required for production):

   ```bash
   pnpm wrangler secret add TEAM_DOMAIN
   # Enter your Cloudflare Access team domain (e.g., https://my-team.cloudflareaccess.com)

   pnpm wrangler secret add POLICY_AUD
   # Enter your Cloudflare Access policy AUD tag
   ```

6. Start the development server:

   ```bash
   pnpm dev
   ```

7. Open your browser and navigate to `http://localhost:5173`

8. Deploy to production:
   ```bash
   pnpm deploy
   ```

## Configuration

### Environment Variables

For development, you can configure the following in your `.dev.vars`:

- `TEAM_DOMAIN`: Your Cloudflare Access team domain (optional, for authentication)
- `POLICY_AUD`: Your Cloudflare Access policy AUD (optional, for authentication)

### Wrangler Secrets

For production deployment, you must set up the following secrets:

```bash
pnpm wrangler secret add TEAM_DOMAIN
# Enter your Cloudflare Access team domain (e.g., https://my-team.cloudflareaccess.com)

pnpm wrangler secret add POLICY_AUD
# Enter your Cloudflare Access policy AUD tag
```

**Important**: These secrets are required for production deployment. The application will work in development without them, but authentication features will be disabled.

### Wrangler Configuration

The application uses Cloudflare Durable Objects for chat state management. The configuration is defined in `wrangler.jsonc`:

- **AI Binding**: Enables Workers AI integration
- **Durable Objects**: Persists chat state across sessions
- **Compatibility**: Node.js compatibility for enhanced functionality

## How It Works

### Frontend (`app/components/ChatPage.tsx`)

- Establishes WebSocket connection to the ChatAgent Durable Object
- Sends user messages as JSON `{ role: "user", content, id }`
- Renders assistant responses with rich markdown support
- Handles loading states, errors, and connection status
- Provides auto-resizing textarea and keyboard shortcuts

### Worker (`worker/index.ts`)

- Routes WebSocket connections to the ChatAgent Durable Object
- Handles message persistence and state management
- Calls Workers AI with conversation history:
  ```ts
  const response = await AI.run("@cf/openai/gpt-oss-120b", {
    instructions: prompt,
    input: JSON.stringify(messages),
  });
  ```
- Processes AI responses and broadcasts to connected clients
- Implements comprehensive error handling and validation

### Authentication (`app/routes/home.tsx`)

- Optional Cloudflare Access JWT verification
- Creates unique Durable Object instances per user
- Falls back to anonymous sessions if authentication is disabled

## Project Structure

```
workers-ai-chat/
├── app/                    # React Router application
│   ├── components/         # React components
│   │   ├── ChatPage.tsx    # Main chat interface
│   │   └── MessageBubble.tsx # Message rendering component
│   ├── routes/             # Route components
│   │   ├── home.tsx        # Home page with authentication
│   │   └── jwt.d.ts        # JWT type definitions
│   ├── root.tsx            # Root layout
│   ├── app.css             # Global styles
│   └── routes.ts           # Route configuration
├── worker/                 # Cloudflare Worker
│   ├── index.ts            # Main worker entry point
│   └── prompt.ts           # AI system prompt
├── public/                 # Static assets
├── package.json            # Dependencies and scripts
├── wrangler.jsonc          # Cloudflare Workers configuration
├── vite.config.ts          # Vite build configuration
└── tsconfig*.json          # TypeScript configurations
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm deploy` - Build and deploy to Cloudflare Workers
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm lint` - Run ESLint
- `pnpm preview` - Preview production build locally
- `pnpm cf-typegen` - Generate Cloudflare Worker types

## Key Components

### ChatPage

The main chat interface featuring:

- Real-time message display with smooth scrolling
- Auto-resizing textarea input with Shift+Enter support
- Loading states and error handling with visual feedback
- Clear history functionality
- Full ARIA accessibility support
- Responsive design with dark theme

### ChatAgent (Durable Object)

Handles server-side chat logic:

- WebSocket connection management
- Message persistence and state management
- AI service integration with robust error handling
- Conversation history tracking
- Batch state updates to prevent race conditions

### MessageBubble

Renders individual messages with:

- Rich markdown support (code blocks, tables, links, blockquotes)
- Copy-to-clipboard functionality for code blocks
- Custom styling with hover effects
- Responsive design
- External link indicators

## Security Features

- Input validation and sanitization
- Error boundary handling
- Optional Cloudflare Access authentication
- Secure WebSocket connections
- Environment variable protection
- Message structure validation

## Performance Optimizations

- React.memo for component optimization
- useCallback for function memoization
- Efficient state management with batch updates
- Minimal re-renders
- Optimized bundle size
- WebSocket connection pooling

## Development

### Adding New Features

1. Frontend components go in `app/components/`
2. New routes in `app/routes/`
3. Worker logic in `worker/`
4. Update types in respective `*.d.ts` files

### Testing

- Run `pnpm typecheck` to verify TypeScript types
- Use `pnpm lint` for code quality checks
- Test WebSocket functionality in development mode

## Deployment

The application deploys as a single Cloudflare Worker with:

- React Router serving the frontend
- Durable Objects handling chat state
- Workers AI providing the chat functionality
- Automatic HTTPS and global distribution

## Notes

- The Worker uses `@cf/openai/gpt-oss-120b` by default. You can swap to other Workers AI text models; see Cloudflare docs for available models.
- Chat history is persisted per user in Durable Objects
- Authentication is optional - the app works in anonymous mode
- All AI processing happens on Cloudflare's edge network

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.

---

Built with ❤️ using Cloudflare Workers AI and React Router v7
