export const diagnosticResultJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["diagnosis", "direction", "study_plan", "recommendations", "insights"],
  properties: {
    diagnosis: {
      type: "object",
      additionalProperties: false,
      required: ["level_estimation", "strengths", "weaknesses"],
      properties: {
        level_estimation: { type: "string" },
        strengths: {
          type: "array",
          items: { type: "string" }
        },
        weaknesses: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    direction: {
      type: "object",
      additionalProperties: false,
      required: ["focus_now", "avoid_now", "next_steps"],
      properties: {
        focus_now: {
          type: "array",
          items: { type: "string" }
        },
        avoid_now: {
          type: "array",
          items: { type: "string" }
        },
        next_steps: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    study_plan: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["day", "topics", "description"],
        properties: {
          day: { type: "integer" },
          topics: {
            type: "array",
            items: { type: "string" }
          },
          description: { type: "string" }
        }
      }
    },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "type", "reason"],
        properties: {
          title: { type: "string" },
          type: {
            type: "string",
            enum: ["article", "course", "documentation"]
          },
          reason: { type: "string" }
        }
      }
    },
    insights: {
      type: "object",
      additionalProperties: false,
      required: ["likely_mistakes", "blocking_points"],
      properties: {
        likely_mistakes: {
          type: "array",
          items: { type: "string" }
        },
        blocking_points: {
          type: "array",
          items: { type: "string" }
        }
      }
    }
  }
} as const;
