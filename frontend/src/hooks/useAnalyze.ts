import { useState } from "react";
import type { AnalyzeResponse, AnalyzeStatus } from "../types";
import { analyzeUrl } from "../api/analyze";

interface State {
  status: AnalyzeStatus;
  result: AnalyzeResponse | null;
  error: string | null;
}

const INITIAL: State = { status: "idle", result: null, error: null };

export function useAnalyze() {
  const [state, setState] = useState<State>(INITIAL);

  async function analyze(url: string) {
    setState({ status: "loading", result: null, error: null });
    try {
      const result = await analyzeUrl(url);
      setState({ status: "success", result, error: null });
    } catch (err) {
      setState({ status: "error", result: null, error: err instanceof Error ? err.message : "Невідома помилка" });
    }
  }

  return { ...state, analyze };
}
