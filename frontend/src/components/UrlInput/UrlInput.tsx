import { useState, } from "react";
import styles from "./UrlInput.module.css";

interface Props {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export const UrlInput = ({ onSubmit, isLoading }: Props) => {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed) onSubmit(trimmed);
  };

  const isDisabled = isLoading || !url.trim();

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://drive.google.com/file/d/..."
        disabled={isLoading}
        required
      />
      <button className={styles.button} type="submit" disabled={isDisabled}>
        {isLoading && <span className={styles.spinner} />}
        Аналізувати
      </button>
    </form>
  );
};
