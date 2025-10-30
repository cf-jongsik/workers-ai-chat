type ChatMessage = ModelMessage & { id: number };
type MessageBubbleProps = {
  message: ChatMessage;
  error?: boolean;
};
