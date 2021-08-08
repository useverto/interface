import { Button, Modal, useTheme } from "@verto/ui";
import { lastViewedChangelog } from "../utils/storage_names";
import { useEffect, useRef } from "react";
import changelog from "../../CHANGELOG.md";
import ReactMarkdown from "react-markdown";
import pkg from "../../package.json";
import styles from "../styles/components/ChangelogModal.module.sass";

const ChangelogModal = (props) => {
  const changelogRef = useRef<HTMLDivElement>();
  const theme = useTheme();

  useEffect(() => {
    if (!changelogRef.current) return;
    changelogRef.current.scrollTop = changelogRef.current.scrollHeight;
  }, [changelogRef.current, props.open]);

  return (
    <Modal {...props}>
      <Modal.Title>v{pkg.version} Changelog</Modal.Title>
      <Modal.Content>
        <div
          className={
            styles.ChangelogContainer +
            " " +
            (theme === "Dark" ? styles.Dark : "")
          }
          ref={changelogRef}
        >
          <ReactMarkdown children={changelog} />
        </div>
        <Button
          small
          className={styles.Ok}
          onClick={() => {
            localStorage.setItem(lastViewedChangelog, pkg.version);
            props.onClose();
          }}
        >
          Ok
        </Button>
      </Modal.Content>
    </Modal>
  );
};

export default ChangelogModal;
