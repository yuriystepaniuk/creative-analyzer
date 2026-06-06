import type { PersonParams } from "../../types";
import styles from "./PersonTable.module.css";

const LABELS: Record<keyof PersonParams, string> = {
  ethnicity: "Раса",
  gender: "Стать",
  age: "Вік",
  activity: "Активність",
  hair_color: "Колір волосся",
  body_type: "Тип тіла",
  clothing: "Одяг",
};

interface Props {
  person: PersonParams;
}

export const PersonTable = ({ person }: Props) => {
  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <tbody>
          {(Object.keys(LABELS) as Array<keyof PersonParams>).map((key) => (
            <tr key={String(key)}>
              <th>{LABELS[key]}</th>
              <td>{person[key] ?? <span className={styles.null}>—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
