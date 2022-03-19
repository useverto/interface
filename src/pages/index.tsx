import { Button, Card, Page, Spacer, useModal } from "@verto/ui";
import { useEffect, useState } from "react";
import { permissions } from "../utils/arconnect";
import { useRouter } from "next/router";
import { RootState } from "../store/reducers";
import { useSelector, useDispatch } from "react-redux";
import { updateAddress } from "../store/actions";
import { AnimatePresence, motion } from "framer-motion";
import { useMediaPredicate } from "react-media-hook";
import { opacityAnimation } from "../utils/animations";
import { gateway, verto as client } from "../utils/arweave";
import { OrderInterface } from "@verto/js/dist/common/faces";
import { fetchRandomArtworkWithUser } from "verto-cache-interface";
import Typed from "typed.js";
import PSTSwitcher from "../components/PSTSwitcher";
import axios from "axios";
import Head from "next/head";
import Metas from "../components/Metas";
import SetupModal from "../components/SetupModal";
import styles from "../styles/views/home.module.sass";

const Home = ({ artwork }: { artwork: any }) => {
  const address = useSelector((state: RootState) => state.addressReducer);
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    const options = {
      strings: ["PSTs", "PSCs", "NFTs", "collectibles", "anything"],
      loop: true,
      loopCount: 2,

      typeSpeed: 100,
      backSpeed: 50,
      backDelay: 2000,
      smartBackspace: false,
    };

    const typed = new Typed("#typed", options);

    return () => {
      typed.destroy();
    };
  }, []);

  const [artworkData, setArtworkData] = useState(artwork);

  useEffect(() => {
    (async () => {
      // TODO
      // const res = await client.getPrice(artwork.id);
      const { data: gecko } = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd"
      );

      setArtworkData((val) => ({
        ...val,
        owner: {
          ...val.owner,
          image: val.owner.image
            ? `${gateway()}/${artwork.owner.image}`
            : undefined,
        },
        //price: res?.price ? (res.price * gecko.arweave.usd).toFixed(2) : null,
        price: 0 ? (0 * gecko.arweave.usd).toFixed(2) : null,
      }));
    })();
  }, []);

  const setupModal = useModal();

  async function login() {
    await window.arweaveWallet.connect(permissions, { name: "Verto" });

    const activeAddress = await window.arweaveWallet.getActiveAddress();
    dispatch(updateAddress(activeAddress));

    const user = await client.user.getUser(activeAddress);

    if (!user) setupModal.setState(true);
  }

  type Activity = OrderInterface & {
    actions: {
      id: string;
      descriptions: string;
      timestamp: number;
      match?: string;
    }[];
  };
  /*const [latestActivity, setLatestActivity] = useState<OrderInterface[]>([]);*/

  const mobile = useMediaPredicate("(max-width: 720px)");

  /*useEffect(() => {
    (async () => {
      const { data: activities } = await axios.get(
        `${CACHE_URL}/latest-activity`
      );

      setLatestActivity(
        activities.map(
          ({
            status,
            sender,
            target,
            token,
            input,
            output,
            timestamp,
            actions,
          }: Activity) => ({
            id: actions[0].id,
            status,
            sender,
            target,
            token,
            input,
            output,
            timestamp,
          })
        )
      );
    })();
  }, []);*/

  return (
    <>
      <Head>
        <title>Verto - Welcome</title>
        <Metas title="Welcome" />
      </Head>
      <Page>
        <Spacer y={5} />
        <div className={styles.Landing}>
          <div className={styles.Hero}>
            <h1>
              Exchange <span id="typed" className={styles.Cursor} />
              <br />
              on Arweave
            </h1>
            <Spacer y={1.35} />
            <p>
              Verto is a decentralized trading protocol
              <br />
              built on top of{" "}
              <a
                href="https://arweave.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                Arweave
              </a>
              .
            </p>
            <Spacer y={1.35} />
            <div className={styles.HeroBtns}>
              <Button
                type="outlined"
                small
                onClick={() => router.push("/space")}
              >
                Explore tokens
              </Button>
              <Spacer x={1} />
              <Button
                small
                onClick={() => {
                  if (!address) login();
                  else router.push("/swap");
                }}
              >
                Trade now
              </Button>
            </div>
          </div>
          <div className={styles.FeaturedToken}>
            <AnimatePresence>
              {Object.keys(artworkData).length > 0 && (
                <motion.div {...opacityAnimation()}>
                  {(artworkData.type === "collection" && (
                    <Card.Collection
                      name={artworkData.name}
                      images={artworkData.images.map(
                        (txID) => `${gateway()}/${txID}`
                      )}
                      userData={{
                        avatar: artworkData.owner?.image,
                        name: artworkData.owner.name,
                        usertag: artworkData.owner.username,
                      }}
                      onClick={() => router.push(`/space/${artworkData.id}`)}
                    />
                  )) || (
                    <Card.Asset
                      name={artworkData.name}
                      userData={{
                        avatar: artworkData.owner?.image,
                        name: artworkData.owner.name,
                        usertag: artworkData.owner.username,
                      }}
                      price={artworkData.price || null}
                      image={`${gateway()}/${artworkData.id}`}
                      onClick={() => router.push(`/space/${artworkData.id}`)}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {/** 
        <Spacer y={5} />
        <div className={styles.Section}>
          <h1 className={styles.Title}>Latest Activity</h1>
          <AnimatePresence>
            {latestActivity.map((activity, i) => (
              <motion.div key={i} {...cardListAnimation(i)}>
                <Card.Order
                  style={
                    mobile ? { justifyContent: "center", minWidth: "0px" } : {}
                  }
                  type={getType(activity.input)}
                  orderID={activity.id}
                  status={activity.status}
                  timestamp={new Date(activity.timestamp * 1000)}
                />
                {i !== latestActivity.length - 1 && <Spacer y={1.5} />}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        */}
        <Spacer y={3} />
        <Spacer y={5} />
        <div className={styles.Section + " " + styles.PSTs}>
          <div className={styles.Text}>
            <h1 className={styles.Title}>What are PSTs?</h1>
            <p className={styles.Description}>
              Profit-Sharing Tokens, or PSTs, are a new incentivization
              mechanism for the open web that allow developers to earn a stream
              of micro-dividends for the duration their application is used. (
              <a
                href="https://arweave.medium.com/profit-sharing-tokens-a-new-incentivization-mechanism-for-an-open-web-1f2532411d6e"
                target="_blank"
                rel="noopener noreferrer"
              >
                Source
              </a>
              )
              <br />
              <br />
              In order for PSTs to have value, however, they need to be able to
              be exchanged for other PSTs or AR. This is where Verto comes in...
            </p>
          </div>
          <PSTSwitcher />
        </div>
        <div className={styles.Section}>
          <h1 className={styles.Title}>Why Verto?</h1>
          <p className={styles.Description}>
            Verto is a completely decentralized network of trading posts built
            on top of the blockweave. Anyone can host their own trading post and
            power the exchange, while also being incentivized to do so. With
            Verto, you can pick the trading post you'd like to use and exchange
            your PSTs freely!
            <br />
            <br />
            Decisions for Verto are made by our very own Profit-Sharing DAO,
            which means that anyone can have a say in the direction of our
            platform.
            <br />
            <br />
            You can also easily host your own Trading Post, while accruing PSTs
            for doing so. See our Trading Post Repository for documentation.
          </p>
        </div>
        <div className={styles.Section}>
          <h1 className={styles.Title}>VRT - The Verto Protocol Token</h1>
          <p className={styles.Description}>
            VRT is a way for any person to passively earn a volume-weighted
            index of all profit sharing tokens being traded on the exchange.
            0.5% of any PST transaction made on the exchange is sent straight to
            a VRT holder.
            <br />
            <br />
            By holding VRT, a user is also inherently a member of the Verto
            Profit-Sharing DAO, which means they can choose to stake their
            tokens to have a say in the various decisions made for the platform.
          </p>
        </div>
        <div className={styles.Section}>
          <h1 className={styles.Title}>Get in Touch</h1>
          <p className={styles.Description}>
            Have a question or are interested in purchasing more VRT than you
            can find on the exchange? Join our Discord. Let's chat!
          </p>
        </div>
      </Page>
      <SetupModal {...setupModal.bindings} />
    </>
  );
};

export async function getServerSideProps() {
  const artwork = (await fetchRandomArtworkWithUser(1))[0];

  return {
    props: {
      artwork,
    },
  };
}

export default Home;
