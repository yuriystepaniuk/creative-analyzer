import { useAnalyze } from "./hooks/useAnalyze";
import { UrlInput } from "./components/UrlInput/UrlInput";
import { ErrorCard } from "./components/ErrorCard/ErrorCard";
import { AnalysisResult } from "./components/AnalysisResult/AnalysisResult";
import styles from "./App.module.css";

export const App = () => {
  const { status, result, error, analyze } = useAnalyze();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Creative Analyzer</h1>
        <p className={styles.subtitle}>
          Вставте публічне посилання Google Drive на зображення або відео
        </p>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>
          <UrlInput onSubmit={analyze} isLoading={status === "loading"} />
        </div>

        {status === "error" && error && <ErrorCard message={error} />}

        {status === "success" && result && <AnalysisResult result={result} />}
      </main>
    </div>
  );
}
