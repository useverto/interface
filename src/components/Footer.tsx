import { Spacer, useTheme } from "@verto/ui";
import styles from "../styles/components/Footer.module.sass";

const Footer = () => {
  const theme = useTheme();

  return (
    <div
      className={styles.Footer + " " + (theme === "Dark" ? styles.Dark : "")}
    >
      <h1 className={styles.Title}>
        <span>Verto</span>
        <Spacer x={0.3} />
        by
        <Spacer x={0.3} />
        <a href="https://th8ta.org" target="_blank" rel="noopener noreferrer">
          th8ta
        </a>
      </h1>
      <div className={styles.Links}>
        <a
          href="https://chat.verto.exchange"
          target="_blank"
          rel="noopener noreferrer"
        >
          Chat
        </a>
        <a
          href="https://github.com/useverto/verto"
          target="_blank"
          rel="noopener noreferrer"
        >
          Code
        </a>
        <a href="https://arweave.org" target="_blank" rel="noopener noreferrer">
          Arweave
        </a>
      </div>
    </div>
  );
};

export default Footer;
