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
  const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
  if (jwt) {
    const [_header, payload, _signature] = jwt.split(".");
    const payloadJson = JSON.parse(atob(payload)) as JWT;
    const email = payloadJson.email;
    const id = ChatAgent.idFromName(email);
    return { agentName: "ChatAgent", roomId: id.toString() };
  } else {
    const id = ChatAgent.newUniqueId();
    return { agentName: "ChatAgent", roomId: id.toString() };
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <ChatPage agentName={loaderData.agentName} roomId={loaderData.roomId} />
  );
}
