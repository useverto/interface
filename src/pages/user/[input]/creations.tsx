import { Card, Page, Spacer, Loading } from "@verto/ui";
import { UserInterface } from "@verto/js/dist/faces";
import { useRouter } from "next/router";
import { arPrice, CACHE_URL } from "../../../utils/arweave";
import { cardAnimation } from "../../../utils/animations";
import { AnimatePresence, motion } from "framer-motion";
import { randomEmoji } from "../../../utils/user";
import axios from "axios";
import Verto from "@verto/js";
import Head from "next/head";
import Metas from "../../../components/Metas";
import useInfiniteScroll from "../../../utils/infinite_scroll";
import styles from "../../../styles/views/user.module.sass";

const client = new Verto();

const Creations = (props: {
  user: UserInterface | null;
  input: string;
  creations: Art[];
}) => {
  const router = useRouter();
  if (router.isFallback) return <></>;

  const { loading, data } = useInfiniteScroll<Art>(loadMore, props.creations);

  async function loadMore(): Promise<Art[]> {
    let arts = [];

    const { data: ids } = await axios.get(
      `${CACHE_URL}/user/${props.user?.username ?? props.input}/creations/${
        data.length * 4
      }`
    );

    for (const id of ids) {
      let { data: artworkData } = await axios.get(
        `${CACHE_URL}/site/artwork/${id}`
      );
      const price = (await arPrice()) * (await client.getPrice(id)).price;

      if (!artworkData.owner.image) artworkData.owner.image = randomEmoji();

      arts.push({
        ...artworkData,
        price,
      });
    }

    return arts;
  }

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
          {data.map((art, i) => (
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
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ ease: "easeInOut", duration: 0.22 }}
          >
            <Spacer y={1} />
            <Loading.Spinner style={{ margin: "0 auto" }} />
          </motion.div>
        )}
      </AnimatePresence>
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
  const creations: Art[] = [];

  for (let i = 0; i < 2; i++) {
    const { data: ids } = await axios.get(
      `${CACHE_URL}/user/${input}/creations/${i * 4}`
    );

    for (const id of ids) {
      let { data } = await axios.get(`${CACHE_URL}/site/artwork/${id}`);
      const price = (await arPrice()) * (await client.getPrice(id)).price;

      if (!data.owner.image) data.owner.image = randomEmoji();

      creations.push({
        ...data,
        price,
      });
    }
  }

  return { props: { creations, user, input }, revalidate: 1 };
}

export default Creations;

export interface Art {
  id: string;
  name: string;
  price?: number;
  owner: UserInterface;
}
