import { Button, Card, Page, Spacer } from "@verto/ui";
import styles from "../styles/views/home.module.sass";
import Typed from "typed.js";
import { useEffect, useState } from "react";
import axios from "axios";

const Home = () => {
  useEffect(() => {
    const options = {
      strings: ["PSTs", "PSCs", "NFTs", "collectibles", "anything"],
      showCursor: false,

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

  const [firstLoad, setFirstLoad] = useState(true);
  const [communities, setCommunities] = useState([]);

  const fetchCommunities = async () => {
    let firstLoad: boolean;
    let communities;
    setFirstLoad((val) => {
      firstLoad = val;
      return val;
    });
    setCommunities((val) => {
      communities = val;
      return val;
    });

    const { data: res } = await axios.get(
      "https://v2.cache.verto.exchange/site/communities/random"
    );
    if (firstLoad) {
      setCommunities(res);
      setFirstLoad(false);
    } else {
      const index = Math.floor(Math.random() * 4);
      communities[index] = res[index];
      setCommunities(communities);
    }
  };

  useEffect(() => {
    const main = async () => {
      await fetchCommunities();
      setTimeout(fetchCommunities, 30000);
    };
    main();
  }, []);

  return (
    <Page>
      <Spacer y={5} />
      <div className={styles.Landing}>
        <div className={styles.Hero}>
          <h1>
            Exchange <span id="typed" />
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
          <Card.Asset
            name="Test"
            userData={{
              avatar: "https://th8ta.org/marton.jpeg",
              name: "Marton Lederer",
              usertag: "martonlederer",
            }}
            price={125}
            image="https://raw.githubusercontent.com/useverto/ui/v2/test/public/art.png"
          />
        </div>
      </div>
      <Spacer y={5} />
    </Page>
  );
};

export default Home;
