import { Card, Page, Spacer } from "@verto/ui";
import { UserInterface } from "@verto/js/dist/faces";
import { useRouter } from "next/router";
import { arPrice, CACHE_URL } from "../../../utils/arweave";
import { cardAnimation } from "../../../utils/animations";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { randomEmoji } from "../../../utils/user";
import axios from "axios";
import Verto from "@verto/js";
import Head from "next/head";
import Metas from "../../../components/Metas";
import styles from "../../../styles/views/user.module.sass";

const client = new Verto();

const Creations = (props: {
  user: UserInterface | null;
  input: string;
  creations: string[];
}) => {
  const router = useRouter();
  if (router.isFallback) return <></>;

  const [items, setItems] = useState<Art[]>([]);

  useEffect(() => {
    (async () => {
      for (const item of props.creations) {
        let { data } = await axios.get(`${CACHE_URL}/site/artwork/${item}`);
        const price = (await arPrice()) * (await client.getPrice(item)).price;

        if (!data.owner.image) data.owner.image = randomEmoji();

        setItems((val) => [...val, { ...data, price }]);
      }
    })();
  }, []);

  return (
    <Page>
      <Head>
        <title>@{props.user?.username || props.input} - Creations</title>
        <Metas
          title="User"
          subtitle={`@${props.user?.username || props.input} - Creations`}
          image={
            (props.user?.image && `https://arweave.net/${props.user.image}`) ||
            undefined
          }
        />
        <meta
          property="profile:username"
          content={props.user?.username || props.input}
        />
      </Head>
      <Spacer y={3} />
      <h1 className="Title">All Creations</h1>
      <Spacer y={3} />
      <div className={styles.Creations}>
        <AnimatePresence>
          {items.map((art, i) => (
            <motion.div
              key={i}
              {...cardAnimation(i)}
              className={styles.CreationItem}
            >
              <Card.Asset
                name={art.name}
                userData={{
                  avatar: art.owner.image,
                  name: art.owner.name,
                  usertag: art.owner.username,
                }}
                // @ts-ignore
                price={art.price ?? " ??"}
                image={`https://arweave.net/${art.id}`}
                onClick={() => router.push(`/space/${art.id}`)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Page>
  );
};

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: "blocking",
  };
}

export async function getStaticProps({ params: { input } }) {
  const user = (await client.getUser(input)) ?? null;
  const { data: creations } = await axios.get(
    `${CACHE_URL}/user/${input}/creations`
  );

  return { props: { creations, user, input }, revalidate: 1 };
}

export default Creations;

export interface Art {
  id: string;
  name: string;
  price?: number;
  owner: UserInterface;
}
