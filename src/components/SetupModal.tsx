import {
  Modal,
  Input,
  useInput,
  Spacer,
  Button,
  Tooltip,
  useToasts,
} from "@verto/ui";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MentionIcon,
} from "@primer/octicons-react";
import { useEffect, useState } from "react";
import { CloseIcon } from "@iconicicons/react";
import { formatAddress } from "../utils/format";
import Instagram from "./icons/Instagram";
import Twitter from "./icons/Github";
import Facebook from "./icons/Facebook";
import Github from "./icons/Github";
import useArConnect from "use-arconnect";
import styles from "../styles/components/SetupModal.module.sass";

export default function SetupModal(props: Props) {
  const nameInput = useInput<string>();
  const usernameInput = useInput<string>();
  const [bio, setBio] = useState("");
  const [page, setPage] = useState(0);
  const [socialLinks, setSocialLinks] = useState<
    Partial<{
      instagram: string;
      twitter: string;
      facebook: string;
      github: string;
    }>
  >({});
  const [currentPfpName, setCurrentPfpName] = useState<string>();
  const [addresses, setAddresses] = useState<string[]>([]);
  const arconnect = useArConnect();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!arconnect) return;
    arconnect.getAllAddresses().then((res) => setAddresses(res));
  }, [props.open, arconnect]);

  useEffect(() => {
    nameInput.setState("");
    nameInput.setStatus(undefined);
    usernameInput.setState("");
    usernameInput.setStatus(undefined);
    setBio("");
    setPage(0);
    setSocialLinks({});
    setCurrentPfpName(undefined);
    setLoading(false);
  }, [props.open]);

  const { setToast } = useToasts();

  async function updateID() {
    setLoading(true);
    try {
      // TODO @johnletey
      setToast({ description: "Updated ID", type: "success", duration: 4500 });
    } catch {
      setToast({
        description: "Could not update Verto ID",
        type: "error",
        duration: 4500,
      });
    }
    setLoading(false);
  }

  return (
    <Modal {...props}>
      <Modal.Title>Setup Verto ID</Modal.Title>
      <Modal.Content>
        {(page === 0 && (
          <>
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
                value={bio}
              ></textarea>
            </div>
          </>
        )) ||
          (page === 1 && (
            <>
              <p className={styles.Description}>
                Now go ahead and provide some extra information for us to
                display.
              </p>
              <Spacer y={2} />
              <Input
                label="Twitter"
                className={styles.Input + " " + styles.WithIconLabel}
                leftInlineLabel={true}
                inlineLabel={<Twitter />}
                value={socialLinks.twitter}
                onChange={(e) =>
                  setSocialLinks((val) => ({ ...val, twitter: e.target.value }))
                }
              />
              <Spacer y={2} />
              <Input
                label="Instagram"
                className={styles.Input + " " + styles.WithIconLabel}
                leftInlineLabel={true}
                inlineLabel={<Instagram />}
                value={socialLinks.instagram}
                onChange={(e) =>
                  setSocialLinks((val) => ({
                    ...val,
                    instagram: e.target.value,
                  }))
                }
              />
              <Spacer y={2} />
              <Input
                label="Facebook"
                className={styles.Input + " " + styles.WithIconLabel}
                leftInlineLabel={true}
                inlineLabel={<Facebook />}
                value={socialLinks.facebook}
                onChange={(e) =>
                  setSocialLinks((val) => ({
                    ...val,
                    facebook: e.target.value,
                  }))
                }
              />
              <Spacer y={2} />
              <Input
                label="Github"
                className={styles.Input + " " + styles.WithIconLabel}
                leftInlineLabel={true}
                inlineLabel={<Github />}
                value={socialLinks.github}
                onChange={(e) =>
                  setSocialLinks((val) => ({ ...val, github: e.target.value }))
                }
              />
            </>
          )) ||
          (page === 2 && (
            <>
              <p className={styles.Description}>
                Want to add a profile picture?
              </p>
              <Spacer y={2} />
              <div className={styles.Pfp}>
                <p>
                  {currentPfpName ||
                    "Drag & drop or click to add a profile picture"}
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCurrentPfpName(e.target.files?.[0]?.name)}
                />
              </div>
            </>
          )) ||
          (page === 3 && (
            <>
              <p className={styles.Description}>
                Add your addresses to your ID.
              </p>
              <Spacer y={2} />
              {addresses.map((addr, i) => (
                <div className={styles.Address} key={i}>
                  <p>{formatAddress(addr)}</p>
                  <Tooltip text="Remove">
                    <CloseIcon
                      onClick={() =>
                        setAddresses((val) =>
                          val.filter((address) => address !== addr)
                        )
                      }
                    />
                  </Tooltip>
                </div>
              ))}
            </>
          ))}
        <Spacer y={2.5} />
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
            onClick={() => {
              if (loading) return;
              setPage((val) => val - 1);
            }}
          >
            <ChevronLeftIcon />
            <Spacer x={0.45} />
            Previous
          </Button>
          <Button
            small
            style={{ paddingRight: "1em" }}
            onClick={() => {
              if (loading) return;
              if (page === 3) updateID();
              else {
                if (
                  (nameInput.state === "" || usernameInput.state === "") &&
                  page === 0
                ) {
                  nameInput.setStatus("error");
                  usernameInput.setStatus("error");
                  return;
                }
                setPage((val) => val + 1);
              }
            }}
            loading={loading}
          >
            {(page === 3 && "Save") || "Next"}
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
