type requestJSON = {
  messages: {
    type: "text";
    content: {
      text: string;
    };
    position: "right";
    _id: string;
    createdAt: number;
    hasTime: boolean;
  }[];
  prompt: string;
};

type inputJSON = {
  role: "user" | "assistant" | "system" | "developer";
  content: string | any[];
}[];
