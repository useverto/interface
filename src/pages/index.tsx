import { Button, Card, Page, Spacer, useModal } from "@verto/ui";
import { useEffect, useState } from "react";
import { permissions } from "../utils/arconnect";
import { useRouter } from "next/router";
import { RootState } from "../store/reducers";
import { useSelector, useDispatch } from "react-redux";
import { updateAddress } from "../store/actions";
import { AnimatePresence, motion } from "framer-motion";
import { opacityAnimation } from "../utils/animations";
import { gateway, verto as client } from "../utils/arweave";
import { fetchRandomArtworkWithUser } from "verto-cache-interface";
import Typed from "typed.js";
import PSTSwitcher from "../components/PSTSwitcher";
import axios from "axios";
import Head from "next/head";
import Metas from "../components/Metas";
import SetupModal from "../components/SetupModal";
import HeroTokens, { fetchTokenLogos } from "../components/HeroTokens";
import styles from "../styles/views/home.module.sass";

const Home = ({
  artwork,
  heroTokens,
}: {
  artwork: any;
  heroTokens: string[];
}) => {
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

  return (
    <>
      <Head>
        <title>Verto - Welcome</title>
        <Metas title="Welcome" />
      </Head>
      <Page>
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
          <HeroTokens images={heroTokens} />
        </div>
        <div className={styles.InfoSection}>
          <div className={[styles.Card, styles.Primary].join(" ")}>
            <h2>PSTs are the xxx xxx xxx of Arweave</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quam id
              tellus quam facilisi lacus et, et tincidunt et. Nisl aenean
              suscipit est ipsum fermentum faucibus malesuada venenatis morbi.
            </p>
          </div>
          <div className={[styles.Card, styles.Secondary].join(" ")}>
            <h2>Verto allows you trade and exchange them seamlessly</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quam id
              tellus quam facilisi lacus et, et tincidunt et. Nisl aenean
              suscipit est ipsum fermentum faucibus malesuada venenatis morbi.
            </p>
            {/* TODO(@martonlederer): add link */}
            <Button>Explore the Permaweb</Button>
          </div>
        </div>

        <h3
          style={{ padding: "2em", width: "100%", border: "2px dashed #f00" }}
        >
          🚧 Work in Progress
        </h3>

        <div className={styles.CTA}>
          <div className={styles.Left}>
            <div className={[styles.Card, styles.DAO].join(" ")}>
              <h2>The Verto DAO</h2>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quam id
                tellus quam facilisi lacus et, et tincidunt et. Nisl aenean
                suscipit est ipsum fermentum faucibus malesuada venenatis morbi.
              </p>
              <Button type="secondary">Learn More</Button>
            </div>
            <div className={[styles.Card, styles.Social].join(" ")}>
              <h3>Join our Community</h3>

              <img
                src="https://cdn.builder.io/api/v1/image/assets%2FTEMP%2Fdc9f90481a4c4147b9b97403445e12e1"
                className="image"
              />
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2FTEMP%2Fdc9f90481a4c4147b9b97403445e12e1"
                className="image"
              />
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2FTEMP%2Fdc9f90481a4c4147b9b97403445e12e1"
                className="image"
              />
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2FTEMP%2Fdc9f90481a4c4147b9b97403445e12e1"
                className="image"
              />
            </div>
          </div>
          <div className={[styles.Card, styles.Right].join(" ")}>
            <h2>For Developers</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quam id
              tellus quam facilisi lacus et, et tincidunt et. Nisl aenean
              suscipit est ipsum fermentum faucibus malesuada venenatis morbi.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quam id
              tellus quam facilisi lacus et, et tincidunt et.
            </p>
            <Button>Read Docs</Button>
          </div>
        </div>
      </Page>
      <SetupModal {...setupModal.bindings} />
    </>
  );
};

export async function getServerSideProps() {
  const artwork = (await fetchRandomArtworkWithUser(1))[0];
  const heroTokens = await fetchTokenLogos();

  return {
    props: {
      artwork,
      heroTokens,
    },
  };
}

export default Home;
