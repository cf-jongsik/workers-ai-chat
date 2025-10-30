import prompt from "./prompt.txt";
import { createRequestHandler } from "react-router";
import { AIChatAgent } from "agents/ai-chat-agent";
import type { ModelMessage } from "ai";
import { routeAgentRequest } from "agents";

type ChatAgentState = {
  id: string;
  name: string;
  count: number;
  messages: ModelMessage[];
  lastUpdate: Date;
};

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
  import.meta.env.MODE
);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const upgrade = request.headers.get("Upgrade");
    const url = new URL(request.url);
    if (url.protocol === "ws:" || upgrade === "websocket") {
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

export class ChatAgent extends AIChatAgent<Env, ChatAgentState> {
  initialState: ChatAgentState = {
    id: "",
    name: "",
    count: 0,
    messages: [],
    lastUpdate: new Date(),
  };

  async onChatMessage(): Promise<Response> {
    const { AI } = this.env;
    if (!AI) {
      return Response.json({ message: "AI not found" }, { status: 500 });
    }
    console.log("do got msg", this.messages.at(this.messages.length - 1));
    const response = await AI.run("@cf/openai/gpt-oss-120b", {
      instructions: prompt,
      input: JSON.stringify([...this.messages]),
    });
    return Response.json(response);
  }
}
