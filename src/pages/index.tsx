import { Button, Page, Spacer, useModal } from "@verto/ui";
import { useEffect } from "react";
import { permissions } from "../utils/arconnect";
import { useRouter } from "next/router";
import { RootState } from "../store/reducers";
import { useSelector, useDispatch } from "react-redux";
import { updateAddress } from "../store/actions";
import { verto as client, gatewayConfig } from "../utils/arweave";
import HeroTokens, { fetchTokenLogos } from "../components/HeroTokens";
import Discord from "../components/icons/Discord";
import Linkedin from "../components/icons/Linkedin";
import Twitter from "../components/icons/Twitter";
import Github from "../components/icons/Github";
import Typed from "typed.js";
import Head from "next/head";
import Metas from "../components/Metas";
import SetupModal from "../components/SetupModal";
import Image from "next/image";
import styles from "../styles/views/home.module.sass";

const Home = ({ heroTokens }: { heroTokens: string[] }) => {
  const address = useSelector((state: RootState) => state.addressReducer);
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    const options = {
      strings: ["tokens", "communities", "NFTs", "collectibles", "anything"],
      loop: true,
      loopCount: 1,

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
    await window.arweaveWallet.connect(
      permissions,
      { name: "Verto" },
      gatewayConfig
    );

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
              Swap <span id="typed" className={styles.Cursor} />
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
                Swap now
              </Button>
            </div>
          </div>
          <HeroTokens images={heroTokens} />
        </Page>
        {/* <Page className={styles.InfoSection}>
          <div className={[styles.Card, styles.Primary].join(" ")}>
            <h2>The 🏠 of Arweave assets</h2>
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
            {//TODO(@martonlederer): add link}
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
          {//table>tr*4>td*3}
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
        </Page> */}

        <Page className={styles.CTA}>
          <div className={styles.Left}>
            <div className={[styles.Card, styles.DAO].join(" ")}>
              <h2>Verto Testnet</h2>
              <p>
                Verto has been completely redesigned from the ground up to
                function trustlessly. We're excited to finally release this into
                the wild, but before we do, we want to bring in the community to
                test this new technology.
              </p>
              <p>
                Please try to break the system and let us know your feedback!
              </p>
              <Button type="secondary">Learn More</Button>
            </div>
            <div className={[styles.Card, styles.Social].join(" ")}>
              <h3>Join our Community</h3>
              <a
                href="https://twitter.com/vertoexchange"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter fill />
              </a>
              <a
                href="https://github.com/useverto"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github fill />
              </a>
              <a
                href="https://verto.exchange/chat"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Discord />
              </a>
              {/* <a
                href="https://www.linkedin.com/company/th8ta/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin />
              </a> */}
            </div>
          </div>
          <div className={[styles.Card, styles.Right].join(" ")}>
            <h2>For Developers</h2>
            <p>
              The new Verto is powered by a SmartWeave contract. Interacting
              with this contract is incredibly simple, and you can use our new
              JavaScript Library to add swapping support in only three lines of
              code.
            </p>
            <p>
              If you have any questions about integration or would like to
              discuss Verto's architecture, feel free to join our community.
            </p>
            <a
              href="httpS://github.com/useverto/js"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button>Read Docs</Button>
            </a>
          </div>
        </Page>
        <Page className={styles.InfoSection}>
          <h2>IMPORTANT</h2>
          <p>
            <ul>
              <li>
                Verto Exchange is currently on a testnet ONLY:
                <ol>
                  <li>
                    The purpose of the testnet is for identifying potential
                    issues in a SANDBOX environment ONLY
                  </li>
                  <li>The testnet can be shut down at ANY TIME</li>
                  <li>The database can be deleted at ANY TIME</li>
                </ol>
                <br />
              </li>
              <li>
                Verto Exchange testnet user participation has the following
                characteristics:
                <ol>
                  <li>ALL user participation is for testing purposes ONLY</li>
                  <li>
                    ALL user interactions with the testnet are for testing
                    purposes ONLY
                  </li>
                  <li>ALL user transactions are for testing purposes ONLY</li>
                  <li>
                    No users will receive ANY form of compensation for
                    participation in the testnet at ANY TIME during or after
                    participation in the testnet
                  </li>
                </ol>
                <br />
              </li>
              <li>
                Verto Exchange testnet tokens have the following
                characteristics:
                <ol>
                  <li>Tokens are NOT real tokens</li>
                  <li>Tokens have NO monetary value</li>
                  <li>
                    Receipt of testnet tokens does NOT constitute any transfer
                    of actual value
                  </li>
                  <li>Tokens can be deleted at ANY TIME</li>
                  <li>
                    Tokens are for use within the testnet for testing purposes
                    ONLY
                  </li>
                  <li>
                    Tokens CANNOT be transferred or utilized outside of the
                    testnet
                  </li>
                </ol>
              </li>
            </ul>
          </p>
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
