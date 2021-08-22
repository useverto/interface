import {
  Modal,
  Input,
  useInput,
  Spacer,
  Button,
  useToasts,
  Popover,
  useTheme,
  Tooltip,
  generateAvatarGradient,
} from "@verto/ui";
import { useEffect, useState } from "react";
import { interactWrite } from "smartweave";
import {
  CACHE_URL,
  client,
  COLLECTION_CONTRACT_SRC,
  COMMUNITY_CONTRACT,
  isAddress,
} from "../utils/arweave";
import {
  PlusIcon,
  SearchIcon,
  TrashIcon,
  AtSignIcon,
  ClipboardIcon,
} from "@iconicicons/react";
import { opacityAnimation } from "../utils/animations";
import { useSelector } from "react-redux";
import { RootState } from "../store/reducers";
import { AnimatePresence, motion } from "framer-motion";
import { fixUserImage } from "../utils/user";
import { formatAddress } from "../utils/format";
import { UserInterface } from "@verto/js/dist/faces";
import Verto from "@verto/js";
import axios from "axios";
import styles from "../styles/components/ListingModal.module.sass";

const verto = new Verto();

const CollectionModal = (props: Props) => {
  const { setToast } = useToasts();
  const collectionNameInput = useInput<string>("");
  const [collectionDescription, setCollectionDescription] = useState("");
  const [collaborators, setCollaborators] = useState<
    UserInterfaceWithGradient[]
  >([]);
  const [items, setItems] = useState<string[]>([]);
  const activeAddress = useSelector((state: RootState) => state.addressReducer);

  useEffect(() => {
    if (!props.open) return;
    collectionNameInput.setState("");
    setCollectionDescription("");
    setCollaborators([]);
    setItems([]);
    setUserQuery("");
    verto
      .getUser(activeAddress)
      .then((user) => setCollaborators([fixUserImage(user)]));
  }, [props.open]);

  interface UserWithDisplayTagInterface extends UserInterfaceWithGradient {
    displaytag?: string;
  }

  const [userQuery, setUserQuery] = useState("");
  const [usersResult, setUsersResult] = useState<UserWithDisplayTagInterface[]>(
    []
  );

  useEffect(() => {
    (async () => {
      let res: UserWithDisplayTagInterface[] = [];

      if (userQuery === "") return setUsersResult([]);

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
          image: generateAvatarGradient(userQuery),
          displaytag: formatAddress(userQuery, 12),
        });

      const { data } = await axios.get(
        `${CACHE_URL}/site/search/${userQuery}?type=user`
      );

      res.push(
        ...data
          .filter(
            ({ type, username, addresses }) =>
              type === "user" &&
              !collaborators.find(
                (collaborator) =>
                  collaborator.username === username ||
                  collaborator.addresses.find((addr) =>
                    addresses.includes(addr)
                  )
              )
          )
          .map((user) => fixUserImage(user))
      );

      setUsersResult(res);
    })();
  }, [userQuery]);

  const theme = useTheme();

  const [collectiblesQuery, setCollectiblesQuery] = useState("");
  const [collectiblesResult, setCollectiblesResult] = useState<
    {
      id: string;
      ticker: string;
      name: string;
      type: "art";
      image: string;
      owner: UserWithDisplayTagInterface;
    }[]
  >([]);

  useEffect(() => {
    (async () => {
      if (collectiblesQuery === "") setCollectiblesResult([]);

      const { data } = await axios.get(
        `${CACHE_URL}/site/search/${collectiblesQuery}?type=art`
      );

      setCollectiblesResult(
        data
          .filter(({ type, id }) => type === "art" && !items.includes(id))
          .map((item) => ({
            ...item,
            owner: fixUserImage(item.owner),
          }))
          .splice(0, 4)
      );
    })();
  }, [collectiblesQuery]);

  async function copyItemsFromClipboard() {
    try {
      const clipboardContent = (await navigator.clipboard.readText()).trim();

      // get the format of IDs on the clipboard
      if (/^((([a-z0-9_-]{43}),)+)([a-z0-9_-]{43})$/i.test(clipboardContent)) {
        // IDs separated with commas
        // e.g.: address1,address2,address3
        setItems((val) => [...val, ...clipboardContent.split(",")]);
      } else if (
        /^((([a-z0-9_-]{43})(, ))+)([a-z0-9_-]{43})$/i.test(clipboardContent)
      ) {
        // IDs separeted with commas and spaces
        // e.g.: address1, address2, address3
        setItems((val) => [...val, ...clipboardContent.split(", ")]);
      } else {
        // try reading it as a JSON array
        try {
          const parsedItems = JSON.parse(clipboardContent);

          if (!Array.isArray(items))
            return setToast({
              description: "Clipboard content is not an array",
              type: "error",
              duration: 4500,
            });

          for (const item of parsedItems) {
            if (typeof item !== "string")
              return setToast({
                description: "An item is not a string",
                type: "error",
                duration: 3000,
              });

            if (!isAddress(item))
              return setToast({
                description: "An item is not a valid ID",
                type: "error",
                duration: 3000,
              });
          }

          setItems((val) => [...val, ...parsedItems]);
        } catch {
          setToast({
            description: "Invalid items format",
            type: "error",
            duration: 4500,
          });
        }
      }
    } catch {
      setToast({
        description: "Could not read clipboard",
        type: "error",
        duration: 4500,
      });
    }
  }

  const [creatingCollection, setCreatingCollection] = useState(false);

  async function createCollection() {
    if (collectionNameInput.state === "")
      return collectionNameInput.setStatus("error");

    if (collectionDescription === "")
      return setToast({
        description: "Please add a short description",
        type: "error",
        duration: 3000,
      });

    if (items.length < 3)
      return setToast({
        description: "Please add at least 3 items to your collection",
        type: "error",
        duration: 4200,
      });

    setCreatingCollection(true);

    try {
      // creating the initial state transactions
      // and the contract transaction in one

      const initialState = {
        name: collectionNameInput.state,
        description: collectionDescription,
        owner: activeAddress,
        collaborators: [],
        items,
      };

      for (const user of collaborators)
        initialState.collaborators.push(...user.addresses);

      // if for some reason the collaborators didn't have
      // the current user, we make sure to add it here
      // as well
      if (!initialState.collaborators.includes(activeAddress)) {
        const currentUser = await verto.getUser(activeAddress);
        initialState.collaborators.push(...currentUser.addresses);
      }

      const contractTx = await client.createTransaction({
        data: JSON.stringify(initialState, null, 2),
      });

      contractTx.addTag("App-Name", "SmartWeaveContract");
      contractTx.addTag("App-Version", "0.3.0");
      contractTx.addTag("Contract-Src", COLLECTION_CONTRACT_SRC);
      contractTx.addTag("Content-Type", "application/json");

      await client.transactions.sign(contractTx);

      let uploader = await client.transactions.getUploader(contractTx);

      while (!uploader.isComplete) {
        await uploader.uploadChunk();
      }

      // listing the collection via its contract ID
      try {
        await interactWrite(client, "use_wallet", COMMUNITY_CONTRACT, {
          function: "list",
          id: contractTx.id,
          type: "collection",
        });

        setToast({
          description: "Collection created and listed",
          type: "success",
          duration: 4500,
        });
        setToast({
          description:
            "Expect a delay before seeing your collection minted and listed",
          type: "warning",
          duration: 3850,
        });
        props.onClose();
      } catch {
        setToast({
          description: "Error listing the collection",
          type: "error",
          duration: 4000,
        });
      }
    } catch {
      setToast({
        description: "Error creating collection contract",
        type: "error",
        duration: 4000,
      });
    }

    setCreatingCollection(false);
  }

  return (
    <Modal {...props} className={styles.Modal}>
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
        <div className={styles.Label + " " + styles.ActionLabel}>
          Collaborators
          <Popover
            content={
              <div className={styles.SearchPopover}>
                <div
                  className={
                    styles.SearchUser +
                    " " +
                    (theme === "Dark" ? styles.DarkSearchUser : "")
                  }
                >
                  <AtSignIcon className={styles.LeftIcon} />
                  <input
                    type="text"
                    placeholder="Search for users..."
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    className={styles.WithLeftIcon}
                  />
                  <SearchIcon />
                </div>
                <Spacer y={0.8} />
                <AnimatePresence>
                  {usersResult.map((user, i) => (
                    <motion.div
                      {...opacityAnimation()}
                      key={i}
                      className={styles.Result}
                      onClick={() => {
                        setCollaborators((val) => [...val, user]);
                        setUsersResult((val) =>
                          val.filter((u) => u.username !== user.username)
                        );
                      }}
                    >
                      {(typeof user.image !== "string" && (
                        <div
                          className={styles.GradientAvatar}
                          style={{ background: user.image?.gradient }}
                        >
                          <span>
                            {(user.name || user.username || "")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                      )) ||
                        (typeof user.image === "string" && (
                          <img src={user.image} draggable={false} alt="U" />
                        ))}
                      <div className={styles.ResultInfo}>
                        {user.name !== "" && <h1>{user.name}</h1>}
                        <h2>@{user.displaytag ?? user.username}</h2>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {usersResult.length === 0 && (
                  <>
                    <p className={styles.PopoverText}>
                      {(userQuery === "" && "Type to search...") ||
                        "No users found."}
                    </p>
                    <Spacer y={0.55} />
                  </>
                )}
              </div>
            }
            position="left"
          >
            <Tooltip text="Add collaborator">
              <div className={styles.AddAction}>
                <PlusIcon />
              </div>
            </Tooltip>
          </Popover>
        </div>
        <div className={styles.Collaborators}>
          <AnimatePresence>
            {collaborators.map((user, i) => (
              <motion.div
                className={
                  styles.Collaborator +
                  " " +
                  (typeof user.image !== "string" ? styles.GradientBg : "")
                }
                key={i}
                {...opacityAnimation(i)}
              >
                {(typeof user.image !== "string" && (
                  <div
                    className={styles.Gradient}
                    style={{ background: user.image?.gradient }}
                  >
                    <span>
                      {(user.name || user.username || "")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                )) ||
                  (typeof user.image === "string" && (
                    <img src={user.image} draggable={false} alt="U" />
                  ))}
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
        <Spacer y={1} />
        <div className={styles.Label + " " + styles.ActionLabel}>
          Items
          <div style={{ display: "flex", alignItems: "center" }}>
            <Tooltip text="From clipboard">
              <div
                className={styles.AddAction}
                onClick={copyItemsFromClipboard}
              >
                <ClipboardIcon />
              </div>
            </Tooltip>
            <Spacer x={0.75} />
            <Popover
              content={
                <div className={styles.SearchPopover}>
                  <div
                    className={
                      styles.SearchUser +
                      " " +
                      (theme === "Dark" ? styles.DarkSearchUser : "")
                    }
                  >
                    <input
                      type="text"
                      placeholder="Search for an item..."
                      value={collectiblesQuery}
                      onChange={(e) => setCollectiblesQuery(e.target.value)}
                    />
                    <SearchIcon />
                  </div>
                  <Spacer y={0.8} />
                  <AnimatePresence>
                    {collectiblesResult.map((item, i) => (
                      <motion.div
                        {...opacityAnimation()}
                        key={i}
                        className={styles.Result}
                        onClick={() => {
                          setItems((val) => [...val, item.id]);
                          setCollectiblesResult((val) =>
                            val.filter(({ id }) => id !== item.id)
                          );
                        }}
                      >
                        <img
                          src={`https://arweave.net/${item.image}`}
                          alt="i"
                          draggable={false}
                          className={styles.Square}
                        />
                        <div className={styles.ResultInfo}>
                          <h1>{item.name}</h1>
                          <h2>{item.ticker}</h2>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {collectiblesResult.length === 0 && (
                    <>
                      <p className={styles.PopoverText}>
                        {(collectiblesQuery === "" && "Type to search...") ||
                          "No items found."}
                      </p>
                      <Spacer y={0.55} />
                    </>
                  )}
                </div>
              }
              position="left"
            >
              <Tooltip text="Add item">
                <div className={styles.AddAction}>
                  <PlusIcon />
                </div>
              </Tooltip>
            </Popover>
          </div>
        </div>
        <div className={styles.Items}>
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                className={styles.Item}
                {...opacityAnimation(i)}
                key={i}
                onClick={() =>
                  setItems((val) => val.filter((itemID) => itemID !== item))
                }
              >
                <img
                  src={`https://arweave.net/${item}`}
                  alt="i"
                  draggable={false}
                />
                <div className={styles.RemoveItem}>
                  <TrashIcon />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <Spacer y={2} />
        <Button
          small
          className={styles.Submit}
          loading={creatingCollection}
          onClick={createCollection}
        >
          Submit
        </Button>
      </Modal.Content>
    </Modal>
  );
};

interface Props {
  open: boolean;
  onClose: () => void;
}

type UserInterfaceWithGradient = Omit<UserInterface, "image"> & {
  image?: ReturnType<typeof generateAvatarGradient> | string;
};

export default CollectionModal;
