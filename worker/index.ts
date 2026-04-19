import { createRequestHandler } from "react-router";
import { routeAgentRequest } from "agents";
import { ChatAgent } from "./agents/ChatAgent";
import { registerBuiltInTools } from "./tools";

// Register built-in tools on startup
registerBuiltInTools();

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const upgrade = request.headers.get("Upgrade");
    const url = new URL(request.url);
    if (
      url.protocol === "ws:" ||
      url.protocol === "wss:" ||
      upgrade === "websocket"
    ) {
      return (
        (await routeAgentRequest(request, env)) ||
        new Response("not found", { status: 404 })
      );
    } else {
      return requestHandler(request, {
        cloudflare: { env, ctx },
      });
    }
  },
} satisfies ExportedHandler<Env>;

export { ChatAgent };
