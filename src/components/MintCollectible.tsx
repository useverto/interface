import { ChevronLeftIcon, ChevronRightIcon } from "@iconicicons/react";
import {
  Modal,
  useInput,
  Input,
  Spacer,
  Button,
  useCheckbox,
  Checkbox,
  useToasts,
} from "@verto/ui";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store/reducers";
import { interactWrite } from "smartweave";
import {
  client,
  COLLECTIBLE_CONTRACT_SRC,
  COMMUNITY_CONTRACT,
} from "../utils/arweave";
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

  useEffect(() => {
    if (!advancedView) return;
    setAllowAdvanced(true);
  }, [advancedView]);

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

  const [loading, setLoading] = useState(false);
  const { setToast } = useToasts();

  async function mint() {
    // checks
    if (nameInput.state === "") return; // TODO: make reset reset the status as well

    if (description === "")
      return setToast({
        description: "Please provide a description",
        type: "error",
        duration: 3000,
      });

    if (!file)
      return setToast({
        description: "Please upload a file",
        type: "error",
        duration: 3000,
      });

    if (
      tickerInput.state === "" ||
      titleInput.state === "" ||
      !tickerInput.state.match(/^[A-Z0-9]+$/)
    )
      return setAdvancedView(true);

    if (balancesObj === "") {
      setAdvancedView(true);
      setToast({
        description: "Please add a balances object",
        type: "error",
        duration: 3000,
      });
      return;
    }

    try {
      const balances = JSON.parse(balancesObj);

      if (Object.keys(balances).length < 1) {
        setAdvancedView(true);
        setToast({
          description: "Please add at least on holder to the balances object",
          type: "error",
          duration: 3450,
        });
        return;
      }
    } catch {
      setAdvancedView(true);
      setToast({
        description: "Invalid JSON in balances",
        type: "error",
        duration: 3400,
      });
      return;
    }

    // inputs are verified, create transaction

    setLoading(true);

    let id = "";
    let data: ArrayBuffer;

    const loadFile = (f: File) =>
      new Promise<ProgressEvent<FileReader>>((resolve, reject) => {
        const reader = new FileReader();

        reader.readAsArrayBuffer(f);
        reader.onload = (e) => resolve(e);
        reader.onerror = (e) => reject(e);
        reader.onabort = (e) => reject(e);
      });

    try {
      data = (await loadFile(file)).target.result as ArrayBuffer;
    } catch {
      setToast({
        description: "Could load file",
        type: "error",
        duration: 3000,
      });
      setLoading(false);
      return;
    }

    try {
      const contractTx = await client.createTransaction({ data });

      contractTx.addTag("Content-Type", file.type);
      contractTx.addTag("Exchange", "Verto");
      contractTx.addTag("Action", "marketplace/create");
      contractTx.addTag("App-Name", "SmartWeaveContract");
      contractTx.addTag("App-Version", "0.3.0");
      contractTx.addTag("Contract-Src", COLLECTIBLE_CONTRACT_SRC);
      contractTx.addTag(
        "Init-State",
        JSON.stringify({
          name: nameInput.state,
          ticker: tickerInput.state,
          title: titleInput.state,
          description,
          owner: address,
          allowMinting: allowMintingCheckbox.state,
          balances: JSON.parse(balancesObj),
          contentType: file.type,
          createdAt: Math.floor(Date.now() / 1000).toString().length,
        })
      );

      await client.transactions.sign(contractTx);

      let uploader = await client.transactions.getUploader(contractTx);

      while (!uploader.isComplete) {
        await uploader.uploadChunk();
      }

      id = contractTx.id;
    } catch {
      setToast({
        description: "Could not mint token",
        type: "error",
        duration: 3000,
      });
      setLoading(false);
      return;
    }

    try {
      await interactWrite(client, "use_wallet", COMMUNITY_CONTRACT, {
        function: "list",
        id,
        type: "art",
      });

      setToast({
        description: "Token minted and listed",
        type: "success",
        duration: 4500,
      });
      props.onClose();
    } catch {
      setToast({
        description: "Could not list token",
        type: "error",
        duration: 3000,
      });
    }

    setLoading(false);
  }

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
              matchPattern={/^(.+)$/}
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
                onClick={() => setAdvancedView(true)}
              >
                Advanced
                <ChevronRightIcon />
              </span>
            </div>
            <Spacer y={1} />
            <Button
              small
              style={{ margin: "0 auto" }}
              loading={loading}
              onClick={mint}
            >
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
              matchPattern={/^[A-Z0-9]+$/}
            />
            <Spacer y={2} />
            <Input
              {...titleInput.bindings}
              placeholder="Title of the collectible..."
              label="Title"
              className={styles.Input}
              matchPattern={/^(.+)$/}
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
