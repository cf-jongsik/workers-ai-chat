import Chat, { Bubble, useMessages, type MessageProps } from "@chatui/core";
import "@chatui/core/dist/index.css";

export function ChatPage() {
  const { messages, appendMsg } = useMessages([]);

  async function handleSend(type: string, val: string) {
    if (type === "text" && val.trim()) {
      appendMsg({
        type: "text",
        content: { text: val },
        position: "right",
      });
      const res = await fetch("/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: messages, prompt: val }),
      });

      if (!res.ok) {
        const error = (await res.json()) as { message: string };
        appendMsg({
          type: "text",
          content: { text: error.message },
          position: "left",
        });
        return;
      }

      const data = (await res.json()) as returnMSG;
      appendMsg({
        type: "text",
        content: { text: data.output[1].content[0].text },
        position: "left",
      });
    }
  }

  function renderMessageContent(msg: MessageProps) {
    const { content } = msg;
    return <Bubble content={content.text} />;
  }

  return (
    <Chat
      locale="en-US"
      placeholder="please enter.."
      isTyping={true}
      navbar={{ title: "Workers AI Chat" }}
      messages={messages}
      renderMessageContent={renderMessageContent}
      onSend={handleSend}
    />
  );
}
