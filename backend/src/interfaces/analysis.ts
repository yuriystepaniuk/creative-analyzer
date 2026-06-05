export interface PersonParams {
  gender: string | null;
  age_range: string | null;
  ethnicity: string | null;
  hair_color: string | null;
  body_type: string | null;
  clothing_style: string | null;
  mood: string | null;
}

export interface AnalysisResult {
  person: PersonParams | null;
  transcript: string | null;
}

export interface DriveFile {
  buffer: ArrayBuffer;
  mimeType: string;
  fileName: string;
}

export interface AnalyzeRequest {
  url: string;
}

export interface AnalyzeMeta {
  fileName: string;
  mimeType: string;
  sizeKb: number;
}

export interface AnalyzeResponse {
  data: AnalysisResult;
  meta: AnalyzeMeta;
}
