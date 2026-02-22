import {
  contentExtractorPrompt,
  conversationPrompt,
  summarizePrompt,
} from "./prompt";
import { createRequestHandler } from "react-router";
import { NodeHtmlMarkdown } from "node-html-markdown";
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
      `New connection established. Sending ${this.state.messages.length} existing messages.`,
    );
    if (this.state.messages.length > 0) {
      this.state.messages.forEach((msg) => {
        connection.send(JSON.stringify(msg));
      });
    } else {
      const welcomeMessage = createAssistantMessage(
        "Hello! I'm an AI assistant. Ask me anything!",
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
          "Invalid message: must have role 'user' and content",
        );
        connection.send(JSON.stringify(errorMsg));
        return;
      }

      console.log(
        `Processing user message: ${userMessage.content.slice(0, 50)}...`,
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
          instructions: conversationPrompt,
          input: conversationHistory,
          tools: [
            {
              name: "fetch",
              description: "Fetch data from the web",
              type: "function",
              parameters: { url: "url to fetch data from" },
              strict: true,
            },
          ],
          max_tokens: 6000,
          reasoning_effort: "low",
        })) as unknown as returnMSG;
        console.log("AI service responded successfully");
      } catch (aiError) {
        console.error("AI service error:", aiError);
        const errorMsg = createErrorMessage(
          "Failed to process your request. Please try again.",
        );
        connection.send(JSON.stringify(errorMsg));
        return;
      }

      // Validate AI response
      if (!response || !response.output || !Array.isArray(response.output)) {
        console.error("Invalid AI response structure:", response);
        const errorMsg = createErrorMessage(
          "Received invalid response from AI service",
        );
        connection.send(JSON.stringify(errorMsg));
        return;
      }

      console.log(
        `Processing ${response.output.length} output items from AI response`,
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
              `Sending assistant message: ${content.slice(0, 50)}...`,
            );
            connection.send(JSON.stringify(assistantMessage));
          }
        }
        if (output.type === "function_call") {
          const functionCall = output as FUNCTION_CALL_FETCH;
          const { url }: { url: string } = JSON.parse(functionCall.arguments);
          if (!url) {
            console.error("Invalid function call arguments");
            const errorMsg = createErrorMessage(
              "Invalid function call arguments\nfunction: " +
                functionCall.name +
                "\nurl: " +
                (url || ""),
            );
            connection.send(JSON.stringify(errorMsg));
            return;
          }
          const functionCallMsg = createAssistantMessage(
            `function calling:\n${functionCall.name}=> url: ${url}`,
          );
          assistantMessages.push(functionCallMsg);
          connection.send(JSON.stringify(functionCallMsg));
          const function_call_response = await fetch(url);
          if (!function_call_response.ok) {
            console.error("Failed to fetch url", url);
            const errorMsg = createErrorMessage(
              "Failed to fetch url\nfunction: " +
                functionCall.name +
                "\nurl: " +
                (url || ""),
            );
            connection.send(JSON.stringify(errorMsg));
            return;
          }
          const function_call_response_text =
            await function_call_response.text();

          const markdown = NodeHtmlMarkdown.translate(
            function_call_response_text.trim(),
          );
          const markdownMsg = createAssistantMessage(
            `Got the markdown. Please wait... Now processing...`,
          );
          assistantMessages.push(markdownMsg);
          connection.send(JSON.stringify(markdownMsg));
          const aiGetBodyResponse = await AI.run(
            "@cf/meta/llama-3.1-8b-instruct-fast",
            {
              messages: [
                {
                  role: "system",
                  content: `${contentExtractorPrompt}`,
                },
                {
                  role: "user",
                  content: `${markdown}`,
                },
              ],
              max_tokens: 10000,
            },
          );
          console.log(aiGetBodyResponse.usage);
          if (!aiGetBodyResponse || !aiGetBodyResponse.response) {
            console.error(
              "could not get body of markdown",
              markdown.slice(0, 50),
            );
            const errorMsg = createErrorMessage(
              "Failed to get body of markdown:\n" + markdown.slice(0, 50),
            );
            connection.send(JSON.stringify(errorMsg));
            return;
          }
          const content = createAssistantMessage(aiGetBodyResponse.response);
          assistantMessages.push(content);
          console.log(
            `Sending assistant message: ${aiGetBodyResponse.response.slice(0, 50)}...`,
          );
          connection.send(JSON.stringify(content));
          const summaryMsg = createAssistantMessage(
            `Now summarizing. Please wait...`,
          );
          assistantMessages.push(summaryMsg);
          connection.send(JSON.stringify(summaryMsg));
          const aiSummaryResponse = await AI.run(
            "@cf/meta/llama-3.1-8b-instruct-fast",
            {
              messages: [
                {
                  role: "system",
                  content: summarizePrompt,
                },
                {
                  role: "user",
                  content: aiGetBodyResponse.response,
                },
              ],
              max_tokens: 6000,
            },
          );
          console.log(aiSummaryResponse.usage);
          if (aiSummaryResponse && aiSummaryResponse.response) {
            const content = createAssistantMessage(aiSummaryResponse.response);
            assistantMessages.push(content);
            console.log(
              `Sending assistant message: ${aiSummaryResponse.response.slice(0, 50)}...`,
            );
            connection.send(JSON.stringify(content));
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
        "An unexpected error occurred. Please try again.",
      );
      connection.send(JSON.stringify(errorMsg));
    }
  }

  onRequest(request: Request): Response | Promise<Response> {
    return new Response("not found", { status: 404 });
  }
}
