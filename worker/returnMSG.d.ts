type returnMSG = {
  id: string;
  created_at: number;
  instructions: string;
  metadata: null | any;
  model: string;
  object: string;
  output: OUTPUT[];
  parallel_tool_calls: true;
  temperature: 1;
  tool_choice: "auto";
  tools: [];
  top_p: 1;
  background: false;
  max_output_tokens: 32688;
  max_tool_calls: null;
  previous_response_id: null;
  prompt: null;
  reasoning: null;
  service_tier: "auto";
  status: "completed";
  text: null;
  top_logprobs: 0;
  truncation: "disabled";
  usage: USAGE[];
  user: null;
};

type OUTPUT =
  | {
      id: string;
      content: [
        {
          text: string;
          type: "reasoning_text";
        }
      ];
      summary: [];
      type: "reasoning";
      encrypted_content: null;
      status: null;
    }
  | {
      id: string;
      content: [
        {
          annotations: [];
          text: string;
          type: "output_text";
          logprobs: null;
        }
      ];
      role: "assistant";
      status: "completed";
      type: "message";
    };

type USAGE = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};
