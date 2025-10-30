import type { Route } from "./+types/home";
import { ChatPage } from "../components/ChatPage";
import { routeAgentRequest } from "agents";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Workers AI Chat" },
    { name: "description", content: "Workers AI Chat" },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { ChatAgent } = context.cloudflare.env;
  const upgrade = request.headers.get("Upgrade");
  if (upgrade === "websocket") {
    await routeAgentRequest(request, context.cloudflare.env);
  }
  const id = ChatAgent.idFromName("default");
  return { agentName: "ChatAgent", roomId: id.name || "default" };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <ChatPage agentName={loaderData.agentName} roomId={loaderData.roomId} />
  );
}
