import { useState } from "react";
import type { AnalyzeResponse, PersonParams } from "../../types";
import { PersonTable } from "../PersonTable/PersonTable";
import { TranscriptBlock } from "../TranscriptBlock/TranscriptBlock";
import styles from "./AnalysisResult.module.css";

interface Props {
  result: AnalyzeResponse;
}

const LABELS: Record<keyof PersonParams, string> = {
  ethnicity: "Раса",
  gender: "Стать",
  age: "Вік",
  activity: "Активність",
  hair_color: "Колір волосся",
  body_type: "Тип тіла",
  clothing: "Одяг",
};

const toTxt = (person: PersonParams): string =>
  (Object.keys(LABELS) as Array<keyof PersonParams>)
    .map((key) => `${LABELS[key]}: ${person[key] ?? "—"}`)
    .join("\n");

const toJson = (person: PersonParams): string =>
  JSON.stringify(person, null, 2);

const CopyButton = ({ label, getText }: { label: string; getText: () => string }) => {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    await navigator.clipboard.writeText(getText());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button className={`${styles.copyBtn} ${copied ? styles.copied : ""}`} onClick={handleClick}>
      {copied ? "✓" : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
      {copied ? "Copied" : label}
    </button>
  );
};

export const AnalysisResult = ({ result }: Props) => {
  const { person, multiple_persons, transcript } = result.data;

  return (
    <>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2 className={styles.title}>Параметри людини</h2>
          {person && (
            <div className={styles.actions}>
              <CopyButton label="JSON" getText={() => toJson(person)} />
              <CopyButton label="TXT" getText={() => toTxt(person)} />
            </div>
          )}
        </div>

        <p className={styles.meta}>
          {result.meta.fileName} · {result.meta.sizeKb} KB
        </p>

        {multiple_persons && (
          <p className={styles.warning}>
            У креативі більше однієї постаті в фокусі — такий креатив не підходить для аналізу.
          </p>
        )}

        {!multiple_persons && person && <PersonTable person={person} />}

        {!multiple_persons && !person && (
          <p className={styles.empty}>У кадрі немає чіткої людини в фокусі</p>
        )}
      </div>

      {transcript !== null && (
        <div className={styles.card}>
          <TranscriptBlock transcript={transcript} />
        </div>
      )}
    </>
  );
};
