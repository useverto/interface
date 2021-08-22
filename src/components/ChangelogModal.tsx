import { Button, Modal, useTheme } from "@verto/ui";
import { lastViewedChangelog } from "../utils/storage_names";
import { useEffect, useRef, useState } from "react";
import marked from "marked";
import changelog from "../../CHANGELOG.md";
import pkg from "../../package.json";
import styles from "../styles/components/ChangelogModal.module.sass";

const ChangelogModal = (props) => {
  const changelogRef = useRef<HTMLDivElement>();
  const theme = useTheme();
  const [formattedChangelog, setFormattedChangelog] = useState("");

  useEffect(() => {
    if (!changelogRef.current || formattedChangelog === "") return;
    changelogRef.current.scrollTop = changelogRef.current.scrollHeight;
  }, [changelogRef.current, props.open, formattedChangelog]);

  useEffect(() => setFormattedChangelog(marked(changelog)), [changelog]);

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
          dangerouslySetInnerHTML={{ __html: formattedChangelog }}
        ></div>
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
