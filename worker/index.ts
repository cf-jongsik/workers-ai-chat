import { prompt } from "./prompt";
import { createRequestHandler } from "react-router";
import {
  Agent,
  type Connection,
  type ConnectionContext,
  type WSMessage,
} from "agents";
import { routeAgentRequest } from "agents";
import type { ModelMessage } from "ai";

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

function createErrorMessage(content: string): ModelMessage {
  return {
    role: "system",
    content: `Error: ${content}`,
  };
}

function createAssistantMessage(content: string): ModelMessage {
  return {
    role: "assistant",
    content,
  };
}

export class ChatAgent extends Agent<Env, chatAgentState> {
  initialState: chatAgentState = {
    messages: [],
    lastUpdate: new Date(),
  };

  onConnect(connection: Connection, ctx: ConnectionContext): void {
    console.log(
      `New connection established. Sending ${this.state.messages.length} existing messages.`
    );
    if (this.state.messages.length > 0) {
      this.state.messages.forEach((msg) => {
        connection.send(JSON.stringify(msg));
      });
    } else {
      const welcomeMessage = createAssistantMessage(
        "Hello! I'm an AI assistant. Ask me anything!"
      );
      connection.send(JSON.stringify(welcomeMessage));
    }
  }

  async onMessage(connection: Connection, message: WSMessage) {
    console.log("Received message:", message.toString().slice(0, 100) + "...");

    try {
      // Validate AI service availability
      const { AI } = this.env;
      if (!AI) {
        console.error("AI service not available in environment");
        const errorMsg = createErrorMessage("AI service is not available");
        connection.send(JSON.stringify(errorMsg));
        return;
      }

      // Parse and validate incoming message
      let userMessage: ModelMessage;
      try {
        userMessage = JSON.parse(message.toString()) as ModelMessage;
      } catch (parseError) {
        console.error("Failed to parse message:", parseError);
        const errorMsg = createErrorMessage("Invalid message format");
        connection.send(JSON.stringify(errorMsg));
        return;
      }

      // Validate message structure
      if (
        !userMessage ||
        typeof userMessage !== "object" ||
        userMessage.role !== "user" ||
        !userMessage.content
      ) {
        console.error("Invalid message structure:", userMessage);
        const errorMsg = createErrorMessage(
          "Invalid message: must have role 'user' and content"
        );
        connection.send(JSON.stringify(errorMsg));
        return;
      }

      console.log(
        `Processing user message: ${userMessage.content.slice(0, 50)}...`
      );

      // Update state with user message
      this.setState({
        messages: [...this.state.messages, userMessage],
        lastUpdate: new Date(),
      });

      // Prepare conversation history for AI
      const conversationHistory = JSON.stringify(this.state.messages);

      // Call AI service with error handling
      let response: returnMSG;
      try {
        console.log("Calling AI service...");
        response = (await AI.run("@cf/openai/gpt-oss-120b", {
          instructions: prompt,
          input: conversationHistory,
        })) as unknown as returnMSG;
        console.log("AI service responded successfully");
      } catch (aiError) {
        console.error("AI service error:", aiError);
        const errorMsg = createErrorMessage(
          "Failed to process your request. Please try again."
        );
        connection.send(JSON.stringify(errorMsg));
        return;
      }

      // Validate AI response
      if (!response || !response.output || !Array.isArray(response.output)) {
        console.error("Invalid AI response structure:", response);
        const errorMsg = createErrorMessage(
          "Received invalid response from AI service"
        );
        connection.send(JSON.stringify(errorMsg));
        return;
      }

      console.log(
        `Processing ${response.output.length} output items from AI response`
      );

      // Process AI response messages
      const assistantMessages: ModelMessage[] = [];

      for (const output of response.output) {
        if (
          output.type === "message" &&
          output.content &&
          Array.isArray(output.content)
        ) {
          const content = output.content
            .filter((item) => item.type === "output_text" && item.text)
            .map((item) => item.text)
            .join("\n");

          if (content.trim()) {
            const assistantMessage = createAssistantMessage(content);
            assistantMessages.push(assistantMessage);
            console.log(
              `Sending assistant message: ${content.slice(0, 50)}...`
            );
            connection.send(JSON.stringify(assistantMessage));
          }
        }
      }

      console.log(`Processed ${assistantMessages.length} assistant messages`);

      // Update state with all assistant messages at once
      if (assistantMessages.length > 0) {
        this.setState({
          messages: [...this.state.messages, ...assistantMessages],
          lastUpdate: new Date(),
        });
      }
    } catch (error) {
      console.error("Unexpected error in onMessage:", error);
      const errorMsg = createErrorMessage(
        "An unexpected error occurred. Please try again."
      );
      connection.send(JSON.stringify(errorMsg));
    }
  }

  onRequest(request: Request): Response | Promise<Response> {
    return new Response("not found", { status: 404 });
  }
}
