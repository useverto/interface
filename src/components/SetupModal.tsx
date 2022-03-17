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
import { useSelector } from "react-redux";
import { RootState } from "../store/reducers";
import { interactWrite } from "smartweave";
import { client, COMMUNITY_CONTRACT, verto } from "../utils/arweave";
import { AnimatePresence, motion } from "framer-motion";
import { opacityAnimation } from "../utils/animations";
import { UserInterface } from "@verto/js/dist/common/faces";
import Instagram from "./icons/Instagram";
import Twitter from "./icons/Twitter";
import Facebook from "./icons/Facebook";
import Github from "./icons/Github";
import useArConnect from "use-arconnect";
import styles from "../styles/components/SetupModal.module.sass";

const socialProfileRegex = /^((?!((https?:\/\/)|@))[^\s]+|(?![\s\S]))$/;

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
  const currentAddress = useSelector(
    (state: RootState) => state.addressReducer
  );
  const [avatar, setAvatar] = useState<File>();
  const [initialImage, setInitialImage] = useState<string>();

  const [user, setUser] = useState<UserInterface>();
  const [addedAddresses, setAddedAddresses] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      if (!arconnect || !currentAddress) return;

      const userData = await verto.user.getUser(currentAddress);
      const arconnectAddresses = await arconnect.getAllAddresses();

      setUser(userData);

      nameInput.setState(userData?.name ?? "");
      nameInput.setStatus(undefined);
      usernameInput.setState(userData?.username ?? "");
      usernameInput.setStatus(undefined);
      setBio(userData?.bio ?? "");
      setPage(0);
      // @ts-ignore
      setSocialLinks(userData?.links ?? "");
      setAddresses((val) => {
        val = userData?.addresses ?? [];

        for (const addr of arconnectAddresses) {
          if (!val.includes(addr)) {
            val.push(addr);
            setAddedAddresses((val) => [...val, addr]);
          }
        }

        return val;
      });
      setInitialImage(userData?.image);
      setCurrentPfpName(undefined);
      setLoading(false);
    })();
  }, [props.open, arconnect, currentAddress]);

  const { setToast } = useToasts();

  async function updateID() {
    if (nameInput.state === "" || usernameInput.state === "") {
      if (nameInput.state === "") nameInput.setStatus("error");
      if (usernameInput.state === "") usernameInput.setStatus("error");

      setPage(0);
      setToast({
        description: "Username or display name is missing",
        type: "error",
        duration: 3750,
      });
      return;
    }

    if (
      Object.values(socialLinks).filter((val) => !val.match(socialProfileRegex))
        .length > 0
    ) {
      setPage(1);
      setToast({
        description: "A social profile username is invalid",
        type: "error",
        duration: 4000,
      });
      return;
    }

    setLoading(true);
    // if there's an avatar uploaded, create a transaction for it
    let image: string = initialImage;

    if (avatar && avatar.type.match(/image\/(.*)/)) {
      try {
        const avatarData = await getAvatarData();
        const avatarTx = await client.createTransaction({
          data: avatarData,
        });

        avatarTx.addTag("Content-Type", avatar.type);
        avatarTx.addTag("App-Name", "Verto");
        avatarTx.addTag("Type", "Avatar-Upload");

        await client.transactions.sign(avatarTx);

        const uploader = await client.transactions.getUploader(avatarTx);

        while (!uploader.isComplete) {
          await uploader.uploadChunk();
        }

        image = avatarTx.id;
      } catch {
        setToast({
          description: "Error uploading avatar. Skipping.",
          type: "error",
          duration: 4500,
        });
      }
    }

    try {
      // update user
      await interactWrite(client, "use_wallet", COMMUNITY_CONTRACT, {
        function: "claim",
        username: usernameInput.state,
        name: nameInput.state,
        addresses,
        image,
        bio,
        links: socialLinks === "" ? {} : socialLinks,
      });

      setToast({
        description: "Saved Verto ID",
        type: "success",
        duration: 3000,
      });
      setToast({
        description: "It might take some time for this to update",
        type: "warning",
        duration: 4500,
      });
      props.onClose();
    } catch {
      setToast({
        description: "Could not update Verto ID",
        type: "error",
        duration: 4500,
      });
    }
    setLoading(false);
  }

  const getAvatarData = () =>
    new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => resolve(e.target.result as ArrayBuffer);
      reader.onerror = (e) => reject(e);
      reader.onabort = (e) => reject(e);
      reader.readAsArrayBuffer(avatar);
    });

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
                onChange={(e) => setBio(e.target.value)}
                placeholder="Enter your bio..."
              >
                {bio ?? ""}
              </textarea>
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
                value={socialLinks.twitter ?? ""}
                matchPattern={socialProfileRegex}
                onChange={(e) =>
                  setSocialLinks((val) => ({ ...val, twitter: e.target.value }))
                }
                placeholder="@username"
              />
              <Spacer y={2} />
              <Input
                label="Instagram"
                className={styles.Input + " " + styles.WithIconLabel}
                leftInlineLabel={true}
                inlineLabel={<Instagram />}
                value={socialLinks.instagram ?? ""}
                matchPattern={socialProfileRegex}
                onChange={(e) =>
                  setSocialLinks((val) => ({
                    ...val,
                    instagram: e.target.value,
                  }))
                }
                placeholder="@username"
              />
              <Spacer y={2} />
              <Input
                label="Facebook"
                className={styles.Input + " " + styles.WithIconLabel}
                leftInlineLabel={true}
                inlineLabel={<Facebook />}
                value={socialLinks.facebook ?? ""}
                matchPattern={socialProfileRegex}
                onChange={(e) =>
                  setSocialLinks((val) => ({
                    ...val,
                    facebook: e.target.value,
                  }))
                }
                placeholder="@username"
              />
              <Spacer y={2} />
              <Input
                label="Github"
                className={styles.Input + " " + styles.WithIconLabel}
                leftInlineLabel={true}
                inlineLabel={<Github />}
                value={socialLinks.github ?? ""}
                matchPattern={socialProfileRegex}
                onChange={(e) =>
                  setSocialLinks((val) => ({ ...val, github: e.target.value }))
                }
                placeholder="@username"
              />
              <AnimatePresence>
                {Object.values(socialLinks).filter(
                  (val) => !val.match(socialProfileRegex)
                ).length > 0 && (
                  <motion.div {...opacityAnimation()}>
                    <Spacer y={2} />
                    <p style={{ color: "#ff0000" }}>
                      Please only enter your username (no URLs or "@"s, no
                      whitespaces)!
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
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
                  onChange={(e) => {
                    setCurrentPfpName(e.target.files?.[0]?.name);
                    setAvatar(e.target.files?.[0]);
                  }}
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
                  <p>
                    {formatAddress(addr)}
                    {addedAddresses.includes(addr) && (
                      <Tooltip text="Address added from ArConnect">
                        <span style={{ color: "#02d43a", marginLeft: ".3em" }}>
                          (JUST ADDED)
                        </span>
                      </Tooltip>
                    )}
                  </p>
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
            style={{ paddingRight: loading ? undefined : "1em" }}
            onClick={() => {
              if (loading) return;
              if (page === 3) updateID();
              else {
                if (
                  (nameInput.state === "" || usernameInput.state === "") &&
                  page === 0
                ) {
                  if (nameInput.state === "") nameInput.setStatus("error");
                  if (usernameInput.state === "")
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
