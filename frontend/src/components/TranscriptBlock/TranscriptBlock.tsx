import styles from "./TranscriptBlock.module.css";

interface Props {
  transcript: string;
}

export const TranscriptBlock = ({ transcript }: Props) => {
  return (
    <div className={styles.container}>
      <p className={styles.title}>Транскрипція аудіо</p>
      <p className={styles.text}>{transcript}</p>
    </div>
  );
}
