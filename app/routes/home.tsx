import type { Route } from "./+types/home";
import { ChatPage } from "../components/ChatPage";
import { routeAgentRequest, getAgentByName } from "agents";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "test agent" },
    { name: "description", content: "testing agent!" },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { ChatAgent } = context.cloudflare.env;
  const upgrade = request.headers.get("Upgrade");
  if (upgrade === "websocket") {
    await routeAgentRequest(request, context.cloudflare.env);
  }
  const id = await getAgentByName(ChatAgent, crypto.randomUUID());
  return { agentName: "ChatAgent", roomId: id.id.toString() };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <ChatPage agentName={loaderData.agentName} roomId={loaderData.roomId} />
  );
}
