export const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export const GEMINI_TEMPERATURE = 0.1;

export const RETRYABLE_STATUSES = new Set([429, 503]);
export const RETRY_DELAYS_MS = [1000, 2000, 4000];

export const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    person: {
      type: "OBJECT",
      nullable: true,
      properties: {
        ethnicity: { type: "STRING", nullable: true },
        gender: { type: "STRING", nullable: true },
        age: { type: "STRING", nullable: true },
        activity: { type: "STRING", nullable: true },
        hair_color: { type: "STRING", nullable: true },
        body_type: { type: "STRING", nullable: true },
        clothing: { type: "STRING", nullable: true },
      },
      required: ["ethnicity", "gender", "age", "activity", "hair_color", "body_type", "clothing"],
    },
    multiple_persons: { type: "BOOLEAN" },
    transcript: { type: "STRING", nullable: true },
  },
  required: ["person", "multiple_persons", "transcript"],
};
