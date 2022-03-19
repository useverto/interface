import {
  Button,
  Card,
  Input,
  Modal,
  Popover,
  Spacer,
  useInput,
  useModal,
  useToasts,
  Tooltip,
  generateAvatarGradient,
  Page,
} from "@verto/ui";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { RootState } from "../../store/reducers";
import {
  TrashIcon,
  PlusIcon,
  EditIcon,
  CheckIcon,
  MinusIcon,
  CloseIcon,
} from "@iconicicons/react";
import { AnimatePresence, motion } from "framer-motion";
import { fixUserImage } from "../../utils/user";
import { UserInterface } from "@verto/js/dist/common/faces";
import { cardAnimation, opacityAnimation } from "../../utils/animations";
import { run } from "ar-gql";
import {
  client as arweave,
  gateway,
  isAddress,
  verto as client,
} from "../../utils/arweave";
import { smartweave } from "smartweave";
import Head from "next/head";
import Metas from "../../components/Metas";
import styles from "../../styles/views/collection.module.sass";

const Collection = ({
  id,
  name,
  description,
  collaborators,
  items,
}: CollectionProps) => {
  const [collaboratorUsers, setCollaboratorUsers] = useState<
    UserInterfaceWithGradient[]
  >([]);
  const activeAddress = useSelector((state: RootState) => state.addressReducer);
  const router = useRouter();
  const [collectionItems, setCollectionItems] = useState(items);

  useEffect(() => {
    (async () => {
      const users: UserInterfaceWithGradient[] = [];

      for (const addr of collaborators) {
        const user = await client.user.getUser(addr);

        if (user && !users.find(({ username }) => username === user.username)) {
          users.push(fixUserImage(user));
        } else if (!user && !users.find(({ username }) => username === addr)) {
          users.push({
            username: addr,
            name: "",
            addresses: [addr],
            image: generateAvatarGradient(addr || ""),
          });
        }
      }

      setCollaboratorUsers(users);
    })();
  }, [collaborators]);

  const [creator, setCreator] = useState<string>();

  useEffect(() => {
    (async () => {
      const { data } = await run(
        `
        query($id: ID!) {
          transaction(id: $id) {
            owner {
              address
            }
          }
        }      
      `,
        { id }
      );

      setCreator(data.transaction.owner.address);
    })();
  }, [id]);

  const detailsModal = useModal();
  const nameInput = useInput(name);
  const [descriptionText, setDescriptionText] = useState(description);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    nameInput.setState(name);
    nameInput.setStatus(undefined);
    setDescriptionText(description);
  }, [detailsModal.state]);

  const { setToast } = useToasts();

  // update name and description
  async function saveDetails() {
    if (nameInput.state === "") return nameInput.setStatus("error");

    if (descriptionText === "")
      return setToast({
        description: "Please add a description",
        type: "error",
        duration: 3450,
      });

    setLoading(true);

    try {
      await smartweave.interactWrite(arweave, "use_wallet", id, {
        function: "updateDetails",
        name: nameInput.state,
        description: descriptionText,
      });

      detailsModal.setState(false);
      setToast({
        description: "Updated collection details",
        type: "success",
        duration: 4500,
      });
    } catch {
      setToast({
        description: "Could not save details",
        type: "error",
        duration: 3200,
      });
    }

    setLoading(false);
  }

  const [editingItems, setEditingItems] = useState(false);
  const addItemModal = useModal();
  const addItemInput = useInput("");

  useEffect(() => addItemInput.reset(), [addItemModal.state]);

  // add item by its ID to the collection
  function addItem() {
    if (
      addItemInput.state === "" ||
      !isAddress(addItemInput.state) ||
      collectionItems.includes(addItemInput.state)
    )
      return addItemInput.setStatus("error");

    setCollectionItems((val) => [...val, addItemInput.state]);
    addItemModal.setState(false);
    setToast({
      description: "Added item. Click the tick icon to save",
      type: "info",
      duration: 4300,
    });
  }

  async function saveItems() {
    const isSame = () => {
      for (const item of collectionItems)
        if (!items.includes(item)) return false;

      return true;
    };

    if (isSame()) return;

    setToast({ description: "Saving items...", type: "info", duration: 2200 });

    try {
      await smartweave.interactWrite(arweave, "use_wallet", id, {
        function: "updateItems",
        items: collectionItems,
      });

      setToast({
        description: "Updated collection items",
        type: "success",
        duration: 4500,
      });
    } catch {
      setToast({
        description: "Could not save items",
        type: "error",
        duration: 3200,
      });
    }
  }

  // did the collaborators get updated ?
  function collaboratorsChanged() {
    for (const addr of collaborators)
      if (!collaboratorUsers.find(({ addresses }) => addresses.includes(addr)))
        return true;

    for (const { addresses } of collaboratorUsers)
      for (const addr of addresses)
        if (!collaborators.includes(addr)) return true;

    return false;
  }

  async function saveCollaborators() {
    if (!collaboratorsChanged()) return;

    setToast({
      description: "Updating collaborators",
      type: "info",
      duration: 3200,
    });

    try {
      await smartweave.interactWrite(arweave, "use_wallet", id, {
        function: "updateCollaborators",
        collaborators: collaboratorUsers
          .map(({ addresses }) => addresses)
          .flat(1),
      });

      setToast({
        description: "Updated collaborators",
        type: "success",
        duration: 4500,
      });
    } catch {
      setToast({
        description: "Could not update collaborators",
        type: "error",
        duration: 3200,
      });
    }
  }

  return (
    <Page>
      <Head>
        <title>Verto - {name}</title>
        <Metas title={name} subtitle={description} />
      </Head>
      <Spacer y={3} />
      <h1 className={"Title " + styles.Title}>
        {name}
        {collaborators.includes(activeAddress) && (
          <EditIcon
            className={styles.EditIcon}
            onClick={() => detailsModal.setState(true)}
          />
        )}
      </h1>
      <Spacer y={0.3} />
      <p className={styles.Subtitle}>{description}</p>
      <Spacer y={0.42} />
      <div
        className={
          styles.Collaborators +
          " " +
          (activeAddress === creator ? styles.EditCollaborators : "")
        }
      >
        <AnimatePresence>
          {collaboratorUsers.map((user, i) => (
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
                    {(user.name || user.username || "").charAt(0).toUpperCase()}
                  </span>
                </div>
              )) ||
                (typeof user.image === "string" && (
                  <img src={user.image} draggable={false} alt="U" />
                ))}
              {!user.addresses.includes(activeAddress) &&
                activeAddress === creator && (
                  <div
                    className={styles.Remove}
                    onClick={() => {
                      if (activeAddress !== creator) return;
                      setCollaboratorUsers((val) =>
                        val.filter((u) => u.username !== user.username)
                      );
                    }}
                  >
                    <TrashIcon />
                  </div>
                )}
            </motion.div>
          ))}
        </AnimatePresence>
        {activeAddress === creator && (
          <div className={styles.Collaborator}>
            <Popover
              content={<>TODO</>}
              position="right"
              style={{ cursor: "auto" }}
            >
              <PlusIcon className={styles.AddCollaborator} />
            </Popover>
          </div>
        )}
        {collaboratorsChanged() && (
          <div className={styles.SaveCollaborators}>
            <Tooltip text="Save">
              <CheckIcon onClick={() => saveCollaborators()} />
            </Tooltip>
          </div>
        )}
      </div>
      <Spacer y={3} />
      {collaboratorUsers.length > 0 && collaborators.includes(activeAddress) && (
        <>
          <div className={styles.ActionSheet}>
            {(editingItems && (
              <>
                <PlusIcon
                  className={styles.ActionIcon}
                  onClick={() => addItemModal.setState(true)}
                />
                <CloseIcon
                  className={styles.ActionIcon}
                  onClick={() => {
                    setCollectionItems(items);
                    setEditingItems(false);
                  }}
                />
                <CheckIcon
                  className={styles.ActionIcon}
                  onClick={() => {
                    saveItems();
                    setEditingItems(false);
                  }}
                />
              </>
            )) || (
              <EditIcon
                className={styles.ActionIcon}
                onClick={() => setEditingItems(true)}
              />
            )}
          </div>
          <Spacer y={1} />
        </>
      )}
      <div className={styles.Items}>
        <AnimatePresence>
          {collaboratorUsers.length > 0 &&
            collectionItems.map((id, i) => (
              <motion.div
                className={styles.Item}
                {...cardAnimation(i)}
                key={i}
                onClick={() => {
                  if (!editingItems) return;
                  setCollectionItems((val) =>
                    val.filter((item) => item !== id)
                  );
                }}
              >
                <AnimatePresence>
                  {editingItems && (
                    <motion.div
                      className={styles.MinusIcon}
                      {...opacityAnimation()}
                    >
                      <MinusIcon />
                    </motion.div>
                  )}
                </AnimatePresence>
                <Card.AssetClear
                  image={`${gateway()}/${id}`}
                  onClick={() => router.push(`/space/${id}`)}
                />
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
      <Modal {...detailsModal.bindings}>
        <Modal.Title>Edit collection</Modal.Title>
        <Modal.Content>
          <Input
            className={styles.ModalInput}
            placeholder="Enter a name..."
            label="Collection name"
            {...nameInput.bindings}
          />
          <Spacer y={1} />
          <p className={styles.InputLabel}>Description</p>
          <div className={styles.ModalTextarea}>
            <textarea
              placeholder="Enter a description for the collection..."
              onChange={(e) => setDescriptionText(e.target.value)}
            >
              {descriptionText}
            </textarea>
          </div>
          <Spacer y={2} />
          <Button
            small
            style={{ margin: "0 auto" }}
            loading={loading}
            onClick={saveDetails}
          >
            Save
          </Button>
        </Modal.Content>
      </Modal>
      <Modal {...addItemModal.bindings}>
        <Modal.Title>Add item</Modal.Title>
        <Modal.Content>
          <Input
            className={styles.ModalInput}
            placeholder="Enter art ID..."
            label="Art id"
            {...addItemInput.bindings}
          />
          <Spacer y={2} />
          <Button small style={{ margin: "0 auto" }} onClick={addItem}>
            Add to collection
          </Button>
        </Modal.Content>
      </Modal>
    </Page>
  );
};

interface CollectionProps {
  id: string;
  name: string;
  description: string;
  collaborators: string[];
  owner: UserInterface;
  items: string[];
  type: "collection";
}

type UserInterfaceWithGradient = Omit<UserInterface, "image"> & {
  image?: ReturnType<typeof generateAvatarGradient> | string;
};

export default Collection;
