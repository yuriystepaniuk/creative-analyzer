export interface PersonParams {
  ethnicity: string | null;
  gender: string | null;
  age: string | null;
  activity: string | null;
  hair_color: string | null;
  body_type: string | null;
  clothing: string | null;
}

export interface AnalysisResult {
  person: PersonParams | null;
  multiple_persons: boolean;
  transcript: string | null;
}

export interface AnalyzeResponse {
  data: AnalysisResult;
  meta: { fileName: string; mimeType: string; sizeKb: number };
}

export type AnalyzeStatus = "idle" | "loading" | "success" | "error";
