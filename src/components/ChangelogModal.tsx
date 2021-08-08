import { Button, Modal } from "@verto/ui";
import { lastViewedChangelog } from "../utils/storage_names";
import changelog from "../../CHANGELOG.md";
import ReactMarkdown from "react-markdown";
import pkg from "../../package.json";
import styles from "../styles/components/ChangelogModal.module.sass";

const ChangelogModal = (props) => (
  <Modal {...props}>
    <Modal.Title>v{pkg.version} Changelog</Modal.Title>
    <Modal.Content>
      <div className={styles.ChangelogContainer}>
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

export default ChangelogModal;
