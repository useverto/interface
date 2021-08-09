import { Modal, useInput, Input, Spacer, Button } from "@verto/ui";
import { useEffect, useState } from "react";
import styles from "../styles/components/SetupModal.module.sass";

const MintCollectible = (props) => {
  const nameInput = useInput<string>();
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File>();
  const [allowMinting, setAllowMinting] = useState(false);

  useEffect(() => {
    nameInput.setState("");
    setDescription("");
  }, [props.open]);

  return (
    <Modal {...props}>
      <Modal.Title>Mint a new collectible</Modal.Title>
      <Modal.Content>
        <Input
          {...nameInput.bindings}
          placeholder="Name of the collectible..."
          label="Name"
          className={styles.Input}
        />
        <Spacer y={2} />
        <p className={styles.Label}>Description</p>
        <div className={styles.Textarea}>
          <textarea
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description for the collectible..."
          >
            {description ?? ""}
          </textarea>
        </div>
        <Spacer y={2} />
        {/** TODO: display image/video if the uploaded file is one */}
        <div className={styles.FileInput}>
          <p>{file?.name || "Drag & drop or click to add a file"}</p>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0])} />
        </div>
        <Spacer y={1} />
        {/** TODO: allow minting checkbox here */}
        <Spacer y={1} />
        <Button small style={{ margin: "0 auto" }}>
          Mint
        </Button>
      </Modal.Content>
    </Modal>
  );
};

export default MintCollectible;
