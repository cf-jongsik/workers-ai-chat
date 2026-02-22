import type { Route } from "./+types/home";
import { ChatPage } from "../components/ChatPage";
import { routeAgentRequest } from "agents";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { parse } from "cookie";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Workers AI Chat" },
    { name: "description", content: "Workers AI Chat" },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const upgrade = request.headers.get("Upgrade");
  if (upgrade === "websocket") {
    await routeAgentRequest(request, context.cloudflare.env);
  }
  const cookie = parse(request.headers.get("Cookie") || "");
  const token =
    cookie["CF_Authorization"] ||
    request.headers.get("Cf-Access-Jwt-Assertion");
  const { ChatAgent, TEAM_DOMAIN, POLICY_AUD } = context.cloudflare.env;

  try {
    if (!token || !TEAM_DOMAIN || !POLICY_AUD) {
      throw new Error("Missing token or TEAM_DOMAIN or POLICY_AUD");
    }
    console.log({
      token: token?.slice(0, 15) + "...",
      TEAM_DOMAIN: TEAM_DOMAIN.slice(0, 15) + "...",
      POLICY_AUD: POLICY_AUD.slice(0, 15) + "...",
    });

    const JWKS = createRemoteJWKSet(
      new URL(`${TEAM_DOMAIN}/cdn-cgi/access/certs`),
    );

    // Verify the JWT
    const { payload } = await jwtVerify<JWT>(token, JWKS, {
      issuer: TEAM_DOMAIN,
      audience: POLICY_AUD,
    });

    const email = payload.email;
    if (!email) {
      throw new Error("Invalid JWT");
    }
    console.log("validation success", { email });
    const id = ChatAgent.idFromName(email);
    console.log("entering room", { email, id: id.toString(), name: id.name });
    return { agentName: "ChatAgent", roomId: id.toString() };
  } catch (e) {
    console.error(e);
    const id = ChatAgent.newUniqueId();
    console.log("entering room", {
      email: "unknown",
      id: id.toString(),
      name: id.name,
    });
    return { agentName: "ChatAgent", roomId: id.toString() };
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <ChatPage agentName={loaderData.agentName} roomId={loaderData.roomId} />
  );
}
