interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: ChatMessageContent;
}
type ChatMessageContent =
  | string
  | (ChatMessageImageContent | ChatMessageTextContent)[];

interface ChatMessageImageContent {
  type: string;
  image_url?: {
    url: string;
  };
  text?: string;
  source?: {
    type: string;
    media_type: string;
    data: string;
  };
}

interface ChatMessageTextContent {
  type: string;
  text: string;
}

type JsonSchema = {
  name: string;
  description?: string;
  schema?: Record<string, unknown>;
  strict?: boolean | null;
};

interface NemotronPrompt {
  prompt?: string; // or Messages
  messages?: ChatMessage[];
  model?: string;
  audio?: {
    voice: string | { id: string };
    format: "wav" | "aac" | "mp3" | "flac" | "opus" | "pcm16";
  };
  frequency_penalty?: number | null;
  logit_bias?: Record<string, number> | null;
  logprobs?: boolean | null;
  top_logprobs?: number | null;
  max_tokens?: number | null;
  max_completion_tokens?: number | null;
  metadata?: Record<string, unknown> | null;
  modalities?: Array<"text" | "audio"> | null;
  n?: number | null;
  parallel_tool_calls?: boolean;
  prediction?: {
    type: "content";
    content: string | Array<{ type: "text"; text: string }>;
  };
  presence_penalty?: number | null;
  reasoning_effort?: "low" | "medium" | "high" | null;
  chat_template_kwargs?: {
    enable_thinking?: boolean;
    clear_thinking?: boolean;
  };
  response_format?:
    | { type: "text" }
    | { type: "json_object" }
    | {
        type: "json_schema";
        json_schema: JsonSchema;
      };
  seed?: number | null;
  service_tier?: "auto" | "default" | "flex" | "scale" | "priority" | null;
  stop?: string | string[] | null;
  store?: boolean | null;
  stream?: boolean | null;
  stream_options?: {
    include_usage?: boolean;
    include_obfuscation?: boolean;
  };
  temperature?: number | null;
  tool_choice?:
    | "none"
    | "auto"
    | "required"
    | { type: "function"; function: { name: string } }
    | { type: "custom"; custom: { name: string } }
    | {
        type: "allowed_tools";
        allowed_tools: {
          mode: "auto" | "required";
          tools: Array<Record<string, unknown>>;
        };
      };
  tools?: Array<
    | {
        type: "function";
        function: {
          name: string;
          description?: string;
          parameters?: Record<string, unknown>;
          strict?: boolean | null;
        };
      }
    | {
        type: "custom";
        custom: {
          name: string;
          description?: string;
          format?:
            | { type: "text" }
            | {
                type: "grammar";
                grammar: {
                  definition: string;
                  syntax: "lark" | "regex";
                };
              };
        };
      }
  >;
  top_p?: number | null;
  user?: string;
  web_search_options?: {
    search_context_size?: "low" | "medium" | "high";
    user_location?: {
      type: "approximate";
      approximate: {
        city?: string;
        country?: string;
        region?: string;
        timezone?: string;
      };
    };
  };
  function_call?: "none" | "auto" | { name: string };
  functions?: Array<{
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
    strict?: boolean | null;
  }>;
}

interface NemotronChatCompletion {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: "assistant";
      content: string | null;
      refusal: string | null;
      annotations?: Array<{
        type: "url_citation";
        url_citation: {
          url: string;
          title: string;
          start_index: number;
          end_index: number;
        };
      }>;
      audio?: {
        id: string;
        data: string;
        expires_at: number;
        transcript: string;
      };
      tool_calls?: Array<
        | {
            id: string;
            type: "function";
            function: {
              name: string;
              arguments: string;
            };
          }
        | {
            id: string;
            type: "custom";
            custom: {
              name: string;
              input: string;
            };
          }
      >;
      function_call?: {
        name: string;
        arguments: string;
      } | null;
    };
    finish_reason:
      | "stop"
      | "length"
      | "tool_calls"
      | "content_filter"
      | "function_call";
    logprobs: {
      content: Array<{
        token: string;
        logprob: number;
        bytes: number[] | null;
        top_logprobs: Array<{
          token: string;
          logprob: number;
          bytes: number[] | null;
        }>;
      }> | null;
      refusal: Array<{
        token: string;
        logprob: number;
        bytes: number[] | null;
        top_logprobs: Array<{
          token: string;
          logprob: number;
          bytes: number[] | null;
        }>;
      }> | null;
    } | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_tokens_details?: {
      cached_tokens?: number;
      audio_tokens?: number;
    };
    completion_tokens_details?: {
      reasoning_tokens?: number;
      audio_tokens?: number;
      accepted_prediction_tokens?: number;
      rejected_prediction_tokens?: number;
    };
  };
  system_fingerprint?: string | null;
  service_tier?: "auto" | "default" | "flex" | "scale" | "priority" | null;
}

interface KimiPrompt {
  prompt?: string;
  messages?: ChatMessage[];
  model?: string;
  audio?: {
    voice: string | { id: string };
    format: "wav" | "aac" | "mp3" | "flac" | "opus" | "pcm16";
  };
  frequency_penalty?: number | null;
  logit_bias?: Record<string, number> | null;
  logprobs?: boolean | null;
  top_logprobs?: number | null;
  max_tokens?: number | null;
  max_completion_tokens?: number | null;
  metadata?: Record<string, unknown> | null;
  modalities?: Array<"text" | "audio"> | null;
  n?: number | null;
  parallel_tool_calls?: boolean;
  prediction?: {
    type: "content";
    content: string | Array<{ type: "text"; text: string }>;
  };
  presence_penalty?: number | null;
  reasoning_effort?: "low" | "medium" | "high" | null;
  chat_template_kwargs?: {
    enable_thinking?: boolean;
    clear_thinking?: boolean;
  };
  response_format?:
    | { type: "text" }
    | { type: "json_object" }
    | {
        type: "json_schema";
        json_schema: JsonSchema;
      };
  seed?: number | null;
  service_tier?: "auto" | "default" | "flex" | "scale" | "priority" | null;
  stop?: string | string[] | null;
  store?: boolean | null;
  stream?: boolean | null;
  stream_options?: {
    include_usage?: boolean;
    include_obfuscation?: boolean;
  };
  temperature?: number | null;
  tool_choice?:
    | "none"
    | "auto"
    | "required"
    | { type: "function"; function: { name: string } }
    | { type: "custom"; custom: { name: string } }
    | {
        type: "allowed_tools";
        allowed_tools: {
          mode: "auto" | "required";
          tools: Array<Record<string, unknown>>;
        };
      };
  tools?: Array<
    | {
        type: "function";
        function: {
          name: string;
          description?: string;
          parameters?: Record<string, unknown>;
          strict?: boolean | null;
        };
      }
    | {
        type: "custom";
        custom: {
          name: string;
          description?: string;
          format?:
            | { type: "text" }
            | {
                type: "grammar";
                grammar: {
                  definition: string;
                  syntax: "lark" | "regex";
                };
              };
        };
      }
  >;
  top_p?: number | null;
  user?: string;
  web_search_options?: {
    search_context_size?: "low" | "medium" | "high";
    user_location?: {
      type: "approximate";
      approximate: {
        city?: string;
        country?: string;
        region?: string;
        timezone?: string;
      };
    };
  };
  function_call?: "none" | "auto" | { name: string };
  functions?: Array<{
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
    strict?: boolean | null;
  }>;
}

interface KimiChatCompletion {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: "assistant";
      content: string | null;
      refusal: string | null;
      annotations?: Array<{
        type: "url_citation";
        url_citation: {
          url: string;
          title: string;
          start_index: number;
          end_index: number;
        };
      }>;
      audio?: {
        id: string;
        data: string;
        expires_at: number;
        transcript: string;
      };
      tool_calls?: Array<
        | {
            id: string;
            type: "function";
            function: {
              name: string;
              arguments: string;
            };
          }
        | {
            id: string;
            type: "custom";
            custom: {
              name: string;
              input: string;
            };
          }
      >;
      function_call?: {
        name: string;
        arguments: string;
      } | null;
    };
    finish_reason:
      | "stop"
      | "length"
      | "tool_calls"
      | "content_filter"
      | "function_call";
    logprobs: {
      content: Array<{
        token: string;
        logprob: number;
        bytes: number[] | null;
        top_logprobs: Array<{
          token: string;
          logprob: number;
          bytes: number[] | null;
        }>;
      }> | null;
      refusal: Array<{
        token: string;
        logprob: number;
        bytes: number[] | null;
        top_logprobs: Array<{
          token: string;
          logprob: number;
          bytes: number[] | null;
        }>;
      }> | null;
    } | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_tokens_details?: {
      cached_tokens?: number;
      audio_tokens?: number;
    };
    completion_tokens_details?: {
      reasoning_tokens?: number;
      audio_tokens?: number;
      accepted_prediction_tokens?: number;
      rejected_prediction_tokens?: number;
    };
  };
  system_fingerprint?: string | null;
  service_tier?: "auto" | "default" | "flex" | "scale" | "priority" | null;
}
