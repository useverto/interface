import { Modal, Input, useInput, Spacer, Button } from "@verto/ui";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MentionIcon,
} from "@primer/octicons-react";
import { useState } from "react";
import styles from "../styles/components/SetupModal.module.sass";

export default function SetupModal(props: Props) {
  const nameInput = useInput<string>();
  const usernameInput = useInput<string>();
  const [bio, setBio] = useState("");
  const [page, setPage] = useState(0);

  return (
    <Modal {...props}>
      <Modal.Title>Setup Verto ID</Modal.Title>
      <Modal.Content>
        <p className={styles.Description}>
          First give us some basic information about yourself.
        </p>
        <Spacer y={2} />
        <Input
          {...nameInput.bindings}
          placeholder="Your display name..."
          label="Name"
          className={styles.Input}
        />
        <Spacer y={2} />
        <Input
          {...usernameInput.bindings}
          placeholder="Your usertag..."
          label="Username"
          className={styles.Input + " " + styles.WithIconLabel}
          leftInlineLabel={true}
          inlineLabel={<MentionIcon />}
        />
        <Spacer y={2} />
        <p className={styles.Label}>Bio</p>
        <div className={styles.Textarea}>
          <textarea
            onChange={(e) => setBio(e.target.textContent)}
            placeholder="Enter your bio..."
          ></textarea>
        </div>
        <Spacer y={2} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Button
            small
            type="outlined"
            style={{ paddingLeft: "1em" }}
            disabled={page === 0}
            onClick={() => setPage((val) => val - 1)}
          >
            <ChevronLeftIcon />
            <Spacer x={0.45} />
            Previous
          </Button>
          <Button
            small
            style={{ paddingRight: "1em" }}
            onClick={() => setPage((val) => val + 1)}
          >
            Next
            <Spacer x={0.45} />
            <ChevronRightIcon />
          </Button>
        </div>
      </Modal.Content>
    </Modal>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
}
