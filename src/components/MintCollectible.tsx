import { ChevronLeftIcon, ChevronRightIcon } from "@iconicicons/react";
import {
  Modal,
  useInput,
  Input,
  Spacer,
  Button,
  useCheckbox,
  Checkbox,
} from "@verto/ui";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store/reducers";
import styles from "../styles/components/SetupModal.module.sass";

const MintCollectible = (props) => {
  const nameInput = useInput<string>();
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File>();
  const allowMintingCheckbox = useCheckbox(true);
  const [fileContent, setFileContent] = useState("");

  const [allowAdvanced, setAllowAdvanced] = useState(false);
  const [advancedView, setAdvancedView] = useState(false);

  const tickerInput = useInput<string>("VRTNFT");
  const titleInput = useInput<string>("");
  const [balancesObj, setBalancesObj] = useState("{}");

  // reset inputs
  useEffect(() => {
    nameInput.reset();
    setDescription("");
    setFile(undefined);
    allowMintingCheckbox.reset();
    setFileContent("");
    tickerInput.reset();
    titleInput.reset();
    setBalancesObj("{}");
    setAllowAdvanced(false);
    setAdvancedView(false);
  }, [props.open]);

  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = (e) => setFileContent(e.target.result as string);
  }, [file]);

  useEffect(() => {
    if (allowAdvanced) return;
    titleInput.setState(nameInput.state);
  }, [nameInput.state]);

  const address = useSelector((state: RootState) => state.addressReducer);

  useEffect(() => {
    if (!address || allowAdvanced) return;
    setBalancesObj(
      JSON.stringify(
        {
          [address]: 1,
        },
        null,
        2
      )
    );
  }, [address, advancedView, props.open]);

  return (
    <Modal {...props}>
      <Modal.Title>Mint a new collectible</Modal.Title>
      <Modal.Content>
        {(!advancedView && (
          <>
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
            <div className={styles.FileInput}>
              <p>
                {(file?.type.match(/^image\//) && (
                  <img src={fileContent} alt="art" draggable={false} />
                )) ||
                  ((file?.type.match(/^video\//) ||
                    file?.type.match(/^audio\//)) && (
                    <video
                      controls={!!file?.type.match(/^audio\//)}
                      muted={!file?.type.match(/^audio\//)}
                      autoPlay
                    >
                      <source src={fileContent} type={file?.type} />
                    </video>
                  ))}
                {file?.name || "Drag & drop or click to add a file"}
              </p>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0])}
              />
            </div>
            <Spacer y={1} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Checkbox {...allowMintingCheckbox.bindings}>
                Allow minting new tokens
              </Checkbox>
              <span
                className={styles.Advanced}
                onClick={() => {
                  setAllowAdvanced(true);
                  setAdvancedView(true);
                }}
              >
                Advanced
                <ChevronRightIcon />
              </span>
            </div>
            <Spacer y={1} />
            <Button small style={{ margin: "0 auto" }}>
              Mint
            </Button>
          </>
        )) || (
          <>
            <Input
              {...tickerInput.bindings}
              placeholder="Token ticker..."
              label="Ticker"
              className={styles.Input}
            />
            <Spacer y={2} />
            <Input
              {...titleInput.bindings}
              placeholder="Title of the collectible..."
              label="Title"
              className={styles.Input}
            />
            <Spacer y={2} />
            <p className={styles.Label}>Balances object</p>
            <div className={styles.Textarea}>
              <textarea
                onChange={(e) => setBalancesObj(e.target.value)}
                placeholder="Object holding the balances of addresses..."
                style={{ fontSize: "1em" }}
              >
                {balancesObj ?? ""}
              </textarea>
            </div>
            <Spacer y={1} />
            <span
              className={styles.Advanced}
              onClick={() => setAdvancedView(false)}
            >
              <ChevronLeftIcon className={styles.LeftIcon} />
              Back
            </span>
          </>
        )}
      </Modal.Content>
    </Modal>
  );
};

export default MintCollectible;
