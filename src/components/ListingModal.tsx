import {
  Modal,
  Input,
  useInput,
  Spacer,
  Button,
  useToasts,
  useModal,
  Popover,
  useTheme,
} from "@verto/ui";
import { useEffect, useState } from "react";
import { interactWrite, readContract } from "smartweave";
import { UserInterface } from "@verto/js/dist/faces";
import { client, COMMUNITY_CONTRACT, isAddress } from "../utils/arweave";
import { PlusIcon, SearchIcon, TrashIcon } from "@iconicicons/react";
import { opacityAnimation } from "../utils/animations";
import { useSelector } from "react-redux";
import { RootState } from "../store/reducers";
import { AnimatePresence, motion } from "framer-motion";
import { randomEmoji } from "../utils/user";
import { formatAddress } from "../utils/format";
import Verto from "@verto/js";
import styles from "../styles/components/ListingModal.module.sass";

const verto = new Verto();

export default function ListingModal(props: Props) {
  const contractIDInput = useInput<string>();
  const [tokenName, setTokenName] = useState("");
  // TODO: custom layout
  const [selectedLayout, setSelectedLayout] = useState<"community" | "art">(
    "community"
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    contractIDInput.setStatus(undefined);
    contractIDInput.setState("");
    setTokenName("");
    setSelectedLayout("community");
  }, [props.open]);

  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    (async () => {
      if (!isAddress(contractIDInput.state)) return setTokenName("");

      try {
        const currentState = await readContract(client, contractIDInput.state);
        setTokenName(currentState.ticker ?? "");

        if (
          !currentState.ticker ||
          !currentState.name ||
          !currentState.balances
        ) {
          setToast({
            description: "Not a token contract",
            type: "error",
            duration: 4500,
          });
          setDisabled(true);
          return;
        }

        setDisabled(false);

        if (currentState.roles || currentState.votes)
          setSelectedLayout("community");
        else setSelectedLayout("art");
      } catch {
        setToast({
          description: "Could not read contract",
          type: "error",
          duration: 2750,
        });
        setDisabled(true);
      }
    })();
  }, [contractIDInput.state]);

  const { setToast } = useToasts();

  async function listToken() {
    if (!isAddress(contractIDInput.state))
      return contractIDInput.setStatus("error");

    setLoading(true);
    try {
      await interactWrite(client, "use_wallet", COMMUNITY_CONTRACT, {
        function: "list",
        id: contractIDInput.state,
        type: selectedLayout,
      });

      setToast({
        description: "Token is now listed",
        type: "success",
        duration: 4500,
      });
      props.onClose();
    } catch {
      setToast({
        description: "Error listing token",
        type: "error",
        duration: 4500,
      });
    }
    setLoading(false);
  }

  const collectionModal = useModal();
  const collectionNameInput = useInput<string>("");
  const [collectionDescription, setCollectionDescription] = useState("");
  const [collaborators, setCollaborators] = useState<UserInterface[]>([]);
  const [items, setItems] = useState<string[]>([]);
  const activeAddress = useSelector((state: RootState) => state.addressReducer);

  useEffect(() => {
    collectionNameInput.setState("");
    setCollectionDescription("");
    setCollaborators([]);
    setItems([]);
    setUserQuery("");
    verto
      .getUser(activeAddress)
      .then((user) => setCollaborators([fixUserImage(user)]));
  }, [collectionModal.state]);

  const fixUserImage = (user: UserInterface) => ({
    ...user,
    image: user.image ? `https://arweave.net/${user.image}` : randomEmoji(),
  });

  interface UserWithDisplayTagInterface extends UserInterface {
    displaytag?: string;
  }

  const [userQuery, setUserQuery] = useState("");
  const [usersResult, setUsersResult] = useState<UserWithDisplayTagInterface[]>(
    []
  );

  useEffect(() => {
    (async () => {
      let res: UserWithDisplayTagInterface[] = [];

      // add to results if search query is an address
      if (
        isAddress(userQuery) &&
        !collaborators.find(
          (collaborator) =>
            collaborator.addresses.includes(userQuery) ||
            collaborator.username === userQuery
        )
      )
        res.push({
          username: userQuery,
          name: "",
          addresses: [userQuery],
          image: randomEmoji(),
          displaytag: formatAddress(userQuery, 12),
        });

      // TODO: fetch user search results from cache

      setUsersResult(res);
    })();
  }, [userQuery]);

  const theme = useTheme();

  return (
    <>
      <Modal {...props} className={styles.Modal}>
        <Modal.Title>List new token</Modal.Title>
        <Modal.Content>
          <Input
            label={
              <>Token contract ID {tokenName !== "" && `(${tokenName})`}</>
            }
            className={styles.Input}
            placeholder="Contract ID"
            type="text"
            {...contractIDInput.bindings}
          />
          <Spacer y={2} />
          <span className={styles.Label}>Choose token layout</span>
          <div className={styles.TokenLayoutPicker}>
            <div
              className={
                styles.TokenItem +
                " " +
                (selectedLayout === "community" ? styles.ActiveItem : "")
              }
              onClick={() => setSelectedLayout("community")}
            >
              <div className={styles.Layout}>
                <CommunitySkeleton />
              </div>
              <span className={styles.Name}>Community</span>
              <span className={styles.Description}>
                Recommended for community PSTs
              </span>
            </div>
            <div
              className={
                styles.TokenItem +
                " " +
                (selectedLayout === "art" ? styles.ActiveItem : "")
              }
              onClick={() => setSelectedLayout("art")}
            >
              <div className={styles.Layout}>
                <ArtSkeleton />
              </div>
              <span className={styles.Name}>Art {"&"} collectible</span>
              <span className={styles.Description}>
                Recommended for arts and other collectibles
              </span>
            </div>
          </div>
          <Spacer y={2} />
          <Button
            small
            className={styles.Submit}
            onClick={listToken}
            loading={loading}
            disabled={disabled}
          >
            Add to space
          </Button>
          <Spacer y={1.5} />
          <p
            className={styles.SideAction}
            onClick={() => {
              collectionModal.setState(true);
              props.onClose();
            }}
          >
            Create collection
          </p>
        </Modal.Content>
      </Modal>
      <Modal {...collectionModal.bindings} className={styles.Modal}>
        <Modal.Title>Create collection</Modal.Title>
        <Modal.Content>
          <Input
            label="Name"
            className={styles.Input}
            placeholder="Collection name..."
            type="text"
            {...collectionNameInput.bindings}
          />
          <Spacer y={2} />
          <p className={styles.Label}>Description</p>
          <div className={styles.Textarea}>
            <textarea
              onChange={(e) => setCollectionDescription(e.target.value)}
              placeholder="Add a description for the collection..."
            >
              {collectionDescription ?? ""}
            </textarea>
          </div>
          <Spacer y={2} />
          <div className={styles.Label + " " + styles.CollaboratorLabel}>
            Collaborators
            <Popover
              content={
                <div className={styles.CollaboratorsPopover}>
                  <div
                    className={
                      styles.SearchUser +
                      " " +
                      (theme === "Dark" ? styles.DarkSearchUser : "")
                    }
                  >
                    <input
                      type="text"
                      placeholder="Search for users..."
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                    />
                    <SearchIcon />
                  </div>
                  <Spacer y={0.8} />
                  <AnimatePresence>
                    {usersResult.map((user, i) => (
                      <motion.div
                        {...opacityAnimation()}
                        key={i}
                        className={styles.UserResult}
                        onClick={() => {
                          setCollaborators((val) => [...val, user]);
                          setUsersResult((val) =>
                            val.filter((u) => u.username !== user.username)
                          );
                        }}
                      >
                        <img src={user.image} alt="u" draggable={false} />
                        <div className={styles.UserInfo}>
                          {user.name !== "" && <h1>{user.name}</h1>}
                          <h2>{user.displaytag ?? user.username}</h2>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              }
              position="left"
            >
              <PlusIcon className={styles.AddCollaborator} />
            </Popover>
          </div>
          <div className={styles.Collaborators}>
            <AnimatePresence>
              {collaborators.map((user, i) => (
                <motion.div
                  className={styles.Collaborator}
                  key={i}
                  {...opacityAnimation(i)}
                >
                  <img src={user.image} draggable={false} alt="U" />
                  {!user.addresses.includes(activeAddress) && (
                    <div
                      className={styles.Remove}
                      onClick={() =>
                        setCollaborators((val) =>
                          val.filter((u) => u.username !== user.username)
                        )
                      }
                    >
                      <TrashIcon />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Modal.Content>
      </Modal>
    </>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const CommunitySkeleton = () => (
  <svg
    width="209"
    height="176"
    viewBox="0 0 209 176"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="39" height="7" rx="2" fill="#E4E4E4" />
    <rect y="87" width="26" height="6" rx="2" fill="#E4E4E4" />
    <rect y="12" width="44" height="13" rx="3" fill="#E4E4E4" />
    <rect y="98" width="138" height="39" rx="3" fill="#E4E4E4" />
    <rect y="144" width="26" height="6" rx="2" fill="#E4E4E4" />
    <rect y="155" width="138" height="21" rx="3" fill="#E4E4E4" />
    <g clipPath="url(#clip0)">
      <ellipse cx="121.5" cy="92" rx="52.5" ry="37" fill="#E4E4E4" />
      <ellipse cx="48.5" cy="87" rx="52.5" ry="37" fill="#E4E4E4" />
    </g>
    <rect x="159" width="50" height="61" rx="4" fill="#E4E4E4" />
    <defs>
      <clipPath id="clip0">
        <rect
          width="138"
          height="43"
          fill="white"
          transform="translate(0 31)"
        />
      </clipPath>
    </defs>
  </svg>
);

const ArtSkeleton = () => (
  <svg
    width="212"
    height="174"
    viewBox="0 0 212 174"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="86" width="39" height="10" rx="2" fill="#E4E4E4" />
    <rect y="129" width="30" height="7" rx="2" fill="#E4E4E4" />
    <rect y="143" width="212" height="12" rx="2" fill="#E4E4E4" />
    <rect y="162" width="212" height="12" rx="2" fill="#E4E4E4" />
    <rect x="111" y="19" width="101" height="96" rx="4" fill="#E4E4E4" />
    <rect y="19" width="101" height="96" rx="4" fill="#E4E4E4" />
  </svg>
);

// TODO
const CustomSkeleton = () => (
  <svg
    width="212"
    height="175"
    viewBox="0 0 212 175"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="39" height="10" rx="2" fill="#E4E4E4" />
    <rect y="130" width="30" height="7" rx="2" fill="#E4E4E4" />
    <rect y="144" width="101" height="12" rx="2" fill="#E4E4E4" />
    <rect y="163" width="101" height="12" rx="2" fill="#E4E4E4" />
    <rect x="111" width="101" height="68" rx="4" fill="#E4E4E4" />
    <g clipPath="url(#clip0)">
      <ellipse cx="209" cy="127" rx="52" ry="37" fill="#E4E4E4" />
      <ellipse cx="141.5" cy="120" rx="44.5" ry="37" fill="#E4E4E4" />
    </g>
    <rect y="20" width="101" height="96" rx="4" fill="#E4E4E4" />
    <rect x="111" y="130" width="101" height="45" rx="4" fill="#E4E4E4" />
    <defs>
      <clipPath id="clip0">
        <rect
          width="101"
          height="43"
          fill="white"
          transform="translate(111 73)"
        />
      </clipPath>
    </defs>
  </svg>
);
