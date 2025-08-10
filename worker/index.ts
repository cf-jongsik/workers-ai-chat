export default {
  async fetch(request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname === "/chat") {
      const ai = env.AI;
      const json = await request.json<requestJSON>();
      if (!json || json.prompt === "") {
        return Response.json({ message: "what?" }, { status: 400 });
      }
      const inputJSON = json.messages.map((item) => ({
        role: item.position === "right" ? "user" : "assistant",
        content: item.content.text,
      })) as inputJSON;
      inputJSON.push({
        role: "user",
        content: json.prompt,
      });
      //@ts-ignore
      const response = await ai.run("@cf/openai/gpt-oss-120b", {
        //@ts-ignore
        instructions: "you are a concise assistant",
        input: JSON.stringify(inputJSON),
      });
      return Response.json(response);
    }
    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
