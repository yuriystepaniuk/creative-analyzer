import type { AnalyzeResponse } from "../types";

export async function analyzeUrl(url: string): Promise<AnalyzeResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new Error("Сервер повернув невалідну відповідь");
  }

  if (!response.ok) {
    throw new Error((json as { error?: string }).error ?? "Помилка сервера");
  }

  return json as AnalyzeResponse;
}
