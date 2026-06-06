import styles from "./ErrorCard.module.css";

interface Props {
  message: string;
}

export const ErrorCard = ({ message }: Props) => {
  return (
    <div className={styles.card}>
      <strong>Помилка:</strong> {message}
    </div>
  );
}
