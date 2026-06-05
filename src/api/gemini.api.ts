import { toBase64 } from "../helpers/base64.helper";
import type { AnalysisResult } from "../interfaces/analysis";
import { GEMINI_API_URL, GEMINI_TEMPERATURE } from "../constants/gemini.constants";

const ANALYSIS_PROMPT = `You are analyzing an advertising creative (image or video) for a performance marketing team in the dating vertical.

TASK:
1. Find the PERSON IN FOCUS — the main subject of the creative. Ignore blurred background figures, bystanders, extras, or people not clearly in focus.
2. For that person, determine the 7 parameters listed below.
3. If the input is a VIDEO, transcribe any spoken words (dialogue or voiceover).

PERSON PARAMETERS (for the person in focus only):
- gender: the perceived gender presentation (e.g. "Female", "Male", "Non-binary"). null if no person.
- age_range: estimated age bracket. Use one of: "18-24", "25-34", "35-44", "45-54", "55+". null if no person.
- ethnicity: perceived ethnic appearance (e.g. "White/Caucasian", "Black/African", "Hispanic/Latino", "East Asian", "South Asian", "Middle Eastern", "Mixed"). null if no person.
- hair_color: hair color (e.g. "Blonde", "Brown", "Black", "Red", "Gray", "Dyed/Unnatural"). null if no person or hair not visible.
- body_type: perceived body type (e.g. "Slim", "Athletic", "Average", "Curvy", "Plus-size"). null if no person or body not visible.
- clothing_style: style of outfit (e.g. "Casual", "Sporty", "Elegant/Formal", "Revealing/Sexy", "Swimwear", "Underwear/Lingerie"). null if no person.
- mood: emotional expression or vibe (e.g. "Happy/Smiling", "Seductive", "Confident", "Playful", "Neutral", "Sad"). null if no person.

TRANSCRIPT RULES:
- If the input is a VIDEO and contains spoken words (dialogue OR voiceover) — return the full transcript in the ORIGINAL language. No translation.
- If there is NO speech (only music, ambient sound, silence) — return null for transcript.
- If the input is an IMAGE — always return null for transcript.
- Do NOT include timestamps.

EDGE CASES:
- If NO person is in focus (e.g. landscape, text-only, object shot) — set person to null. Transcript can still be present.
- If a parameter cannot be determined from the visual — set that field to null.
- Analyze only what is clearly visible. Do not guess.

Return ONLY a valid JSON object. No markdown. No explanation. No extra text.`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    person: {
      type: "OBJECT",
      nullable: true,
      properties: {
        gender: { type: "STRING", nullable: true },
        age_range: { type: "STRING", nullable: true },
        ethnicity: { type: "STRING", nullable: true },
        hair_color: { type: "STRING", nullable: true },
        body_type: { type: "STRING", nullable: true },
        clothing_style: { type: "STRING", nullable: true },
        mood: { type: "STRING", nullable: true },
      },
      required: ["gender", "age_range", "ethnicity", "hair_color", "body_type", "clothing_style", "mood"],
    },
    transcript: { type: "STRING", nullable: true },
  },
  required: ["person", "transcript"],
};

export async function analyzeWithGemini(
  apiKey: string,
  buffer: ArrayBuffer,
  mimeType: string
): Promise<AnalysisResult> {
  const base64Data = toBase64(buffer);

  const body = {
    contents: [
      {
        parts: [
          { text: ANALYSIS_PROMPT },
          { inline_data: { mime_type: mimeType, data: base64Data } },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: GEMINI_TEMPERATURE,
    },
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Gemini API error ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson?.error?.message ?? errorMessage;
    } catch {
      // use default message
    }
    throw new Error(errorMessage);
  }

  const data = await response.json() as GeminiResponse;
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("Gemini returned an empty response");
  }

  try {
    return JSON.parse(rawText) as AnalysisResult;
  } catch {
    throw new Error("Failed to parse Gemini response as JSON");
  }
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  error?: { message: string };
}
