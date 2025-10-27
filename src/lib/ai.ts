import { Ai } from "@cloudflare/ai";

export interface AiModifyRequest {
  prompt: string;
  itinerary: unknown;
}

export interface AiModifyResponse {
  updates: Array<{
    day: number;
    order?: Array<{ entity_id: string }>;
    add?: Array<{ entity_id: string; position?: number }>;
    remove?: Array<{ entity_id: string }>;
    notes?: string;
  }>;
  metadata?: Record<string, unknown>;
}

export interface AiSuggestionResponse {
  title: string;
  description: string;
  suggestedStops: Array<{
    entity_id: string;
    rationale: string;
  }>;
}

export type AiBinding = Ai;

export async function modifyItinerary(
  ai: Ai,
  model: string,
  request: AiModifyRequest
): Promise<AiModifyResponse> {
  const result = await ai.run(model, {
    messages: [
      {
        role: "system",
        content:
          "You are Bay Area Trip Architect, respond with JSON describing modifications to the itinerary."
      },
      {
        role: "user",
        content: JSON.stringify(request)
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ItineraryUpdate",
        schema: {
          type: "object",
          required: ["updates"],
          properties: {
            updates: {
              type: "array",
              items: {
                type: "object",
                required: ["day"],
                properties: {
                  day: { type: "number" },
                  order: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["entity_id"],
                      properties: {
                        entity_id: { type: "string" }
                      }
                    }
                  },
                  add: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["entity_id"],
                      properties: {
                        entity_id: { type: "string" },
                        position: { type: "number" }
                      }
                    }
                  },
                  remove: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["entity_id"],
                      properties: {
                        entity_id: { type: "string" }
                      }
                    }
                  },
                  notes: { type: "string" }
                }
              }
            },
            metadata: { type: "object", additionalProperties: true }
          }
        }
      }
    }
  });

  if (!result?.response) {
    throw new Error("AI response missing payload");
  }

  return result.response as AiModifyResponse;
}

export async function surpriseMe(
  ai: Ai,
  model: string,
  itinerarySummary: unknown
): Promise<AiSuggestionResponse> {
  const result = await ai.run(model, {
    messages: [
      {
        role: "system",
        content:
          "Provide a JSON object with a unique outing title, description, and list of suggested stops."
      },
      {
        role: "user",
        content: JSON.stringify({ itinerarySummary })
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "Suggestion",
        schema: {
          type: "object",
          required: ["title", "description", "suggestedStops"],
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            suggestedStops: {
              type: "array",
              items: {
                type: "object",
                required: ["entity_id", "rationale"],
                properties: {
                  entity_id: { type: "string" },
                  rationale: { type: "string" }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!result?.response) {
    throw new Error("AI response missing payload");
  }

  return result.response as AiSuggestionResponse;
}
