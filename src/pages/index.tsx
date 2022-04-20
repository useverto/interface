import { Button, Page, Spacer, useModal } from "@verto/ui";
import { useEffect } from "react";
import { permissions } from "../utils/arconnect";
import { useRouter } from "next/router";
import { RootState } from "../store/reducers";
import { useSelector, useDispatch } from "react-redux";
import { updateAddress } from "../store/actions";
import { verto as client } from "../utils/arweave";
import Typed from "typed.js";
import Head from "next/head";
import Metas from "../components/Metas";
import SetupModal from "../components/SetupModal";
import HeroTokens, { fetchTokenLogos } from "../components/HeroTokens";
import styles from "../styles/views/home.module.sass";
import Image from "next/image";

const Home = ({ heroTokens }: { heroTokens: string[] }) => {
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
      <div>
        <Page className={styles.Landing}>
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
        </Page>
        <Page className={styles.InfoSection}>
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
        </Page>

        <Page className={styles.Ecosystem}>
          <h1>The Verto Ecosystem</h1>
          <p>
            <strong>$VRT</strong> is a way for any person to passively earn a
            volume-weighted index of all profit sharing tokens being traded on
            the exchange. 0.5% of any PST transaction made on the exchange is
            sent straight to a VRT holder.
          </p>
        </Page>

        <h3
          style={{
            padding: "2em",
            margin: "2em auto",
            width: "50%",
            textAlign: "center",
            border: "2px dashed #f00",
          }}
        >
          🚧 TOKEN_ANIMATION_PLACEHOLDER 🚧
        </h3>

        <Page className={styles.Assets}>
          {/* table>tr*4>td*3 */}
          <table className={styles.AssetsTable}>
            {[1, 2, 3, 4].map((_, i) => (
              <tr key={i} className={styles.AssetRow}>
                <td className={styles.AssetName}>
                  <Image
                    src="https://via.placeholder.com/128"
                    width={46}
                    height={46}
                    className={styles.AssetImage}
                  />
                  <div>
                    <h3>Asset Name</h3>
                    <p>TIKR</p>
                  </div>
                </td>
                <td className={styles.AssetPrice}>
                  <p>$123,456,789.00</p>
                </td>
                <td className={styles.AssetChange}>
                  <p>100.00%</p>
                </td>
              </tr>
            ))}
          </table>
        </Page>

        <Page className={styles.CTA}>
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
        </Page>
      </div>
      <SetupModal {...setupModal.bindings} />
    </>
  );
};

export async function getServerSideProps() {
  const heroTokens = await fetchTokenLogos();

  return {
    props: {
      heroTokens,
    },
  };
}

export default Home;
