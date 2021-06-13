import { Modal, Input, useInput, Spacer, Button } from "@verto/ui";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MentionIcon,
} from "@primer/octicons-react";
import { useState } from "react";
import Instagram from "./icons/Instagram";
import Twitter from "./icons/Github";
import Facebook from "./icons/Facebook";
import Github from "./icons/Github";
import styles from "../styles/components/SetupModal.module.sass";

export default function SetupModal(props: Props) {
  const nameInput = useInput<string>();
  const usernameInput = useInput<string>();
  const [bio, setBio] = useState("");
  const [page, setPage] = useState(0);
  const [isNext, setIsNext] = useState(true);
  const [socialLinks, setSocialLinks] = useState<
    Partial<{
      intagram: string;
      twitter: string;
      facebook: string;
      github: string;
    }>
  >({});
  const [currentPfpName, setCurrentPfpName] = useState<string>();

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
                value={socialLinks.intagram}
                onChange={(e) =>
                  setSocialLinks((val) => ({
                    ...val,
                    intagram: e.target.value,
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
              setIsNext(false);
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
              if (
                (nameInput.state === "" || usernameInput.state === "") &&
                page === 0
              ) {
                nameInput.setStatus("error");
                usernameInput.setStatus("error");
                return;
              }
              setIsNext(true);
              setPage((val) => val + 1);
            }}
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
