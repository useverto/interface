import { Button, Card, Page, Spacer, useSelect } from "@verto/ui";
import styles from "../styles/views/home.module.sass";
import Typed from "typed.js";
import { useEffect, useState } from "react";
import PSTSwitcher from "../components/PSTSwitcher";
import axios from "axios";
import Verto from "@verto/js";

const client = new Verto();

const Home = () => {
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

  const [artwork, setArtwork] = useState<any>({});

  useEffect(() => {
    (async () => {
      const { data } = await axios.get(
        "https://v2.cache.verto.exchange/site/artwork"
      );
      const res = await client.getPrice(data.id);
      const { data: gecko } = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd"
      );

      setArtwork({
        ...data,
        price: (res.price * gecko.arweave.usd).toFixed(2),
      });
    })();
  }, []);

  return (
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
            <Button type="outlined" small>
              Explore tokens
            </Button>
            <Spacer x={1} />
            <Button small>Trade now</Button>
          </div>
        </div>
        <div className={styles.FeaturedToken}>
          {Object.keys(artwork).length && (
            <Card.Asset
              name={artwork.name}
              userData={{
                avatar: `https://arweave.net/${artwork.owner.image}`,
                name: artwork.owner.name,
                usertag: artwork.owner.username,
              }}
              price={artwork.price}
              image={`https://arweave.net/${artwork.id}`}
            />
          )}
        </div>
      </div>
      <Spacer y={5} />
      <div className={styles.Section}>
        <h1 className={styles.Title}>Latest Activity</h1>
        <Card.Order
          type="sell"
          orderID="WE5dJ4BenAiBbjs8zs8EWAsOo33gjwadsfa7ntxVLVc"
          status="success"
          timestamp={new Date()}
        />
        <Spacer y={1.5} />
        <Card.ArtActivity
          type="buy"
          user={{
            avatar: "https://th8ta.org/marton.jpeg",
            usertag: "martonlederer",
            name: "Marton Lederer",
          }}
          timestamp={new Date()}
          price={{ usd: 1204.768548, ar: 300.43256424 }}
          orderID="WE5dJ4BenAiBbjs8zs8EWAsOo33gjwadsfa7ntxVLVc"
        />
        <Spacer y={1.5} />
        <Card.ArtActivity
          type="buy"
          user={{
            avatar: "https://th8ta.org/marton.jpeg",
            usertag: "martonlederer",
            name: "Marton Lederer",
          }}
          timestamp={new Date()}
          price={{ usd: 1204.768548, ar: 300.43256424 }}
          orderID="WE5dJ4BenAiBbjs8zs8EWAsOo33gjwadsfa7ntxVLVc"
        />
        <Spacer y={1.5} />
        <Card.Order
          type="sell"
          orderID="WE5dJ4BenAiBbjs8zs8EWAsOo33gjwadsfa7ntxVLVc"
          status="success"
          timestamp={new Date()}
        />
      </div>
      <Spacer y={5} />
      <div className={styles.Section + " " + styles.PSTs}>
        <div className={styles.Text}>
          <h1 className={styles.Title}>What are PSTs?</h1>
          <p className={styles.Description}>
            Profit-Sharing Tokens, or PSTs, are a new incentivization mechanism
            for the open web that allow developers to earn a stream of
            micro-dividends for the duration their application is used. (
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
            In order for PSTs to have value, however, they need to be able to be
            exchanged for other PSTs or AR. This is where Verto comes in...
          </p>
        </div>
        <PSTSwitcher />
      </div>
      <div className={styles.Section}>
        <h1 className={styles.Title}>Why Verto?</h1>
        <p className={styles.Description}>
          Verto is a completely decentralized network of trading posts built on
          top of the blockweave. Anyone can host their own trading post and
          power the exchange, while also being incentivized to do so. With
          Verto, you can pick the trading post you'd like to use and exchange
          your PSTs freely!
          <br />
          <br />
          Decisions for Verto are made by our very own Profit-Sharing DAO, which
          means that anyone can have a say in the direction of our platform.
          <br />
          <br />
          You can also easily host your own Trading Post, while accruing PSTs
          for doing so. See our Trading Post Repository for documentation.
        </p>
      </div>
      <div className={styles.Section}>
        <h1 className={styles.Title}>VRT - The Verto Protocol Token</h1>
        <p className={styles.Description}>
          VRT is a way for any person to passively earn a volume-weighted index
          of all profit sharing tokens being traded on the exchange. 0.5% of any
          PST transaction made on the exchange is sent straight to a VRT holder.
          <br />
          <br />
          By holding VRT, a user is also inherently a member of the Verto
          Profit-Sharing DAO, which means they can choose to stake their tokens
          to have a say in the various decisions made for the platform.
          <br />
          <ul>
            <li>
              VRT Contract Address: usjm4PCxUd5mtaon7zc97-dt-3qf67yPyqgzLnLqk5A
            </li>
            <li>Initial Supply: 250,000,000 VRT</li>
          </ul>
        </p>
      </div>
      <div className={styles.Section}>
        <h1 className={styles.Title}>Get in Touch</h1>
        <p className={styles.Description}>
          Have a question or are interested in purchasing more VRT than you can
          find on the exchange? Join our Discord. Let's chat!
        </p>
      </div>
    </Page>
  );
};

export default Home;