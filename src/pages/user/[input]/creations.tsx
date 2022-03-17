import { Card, Page, Spacer, Loading } from "@verto/ui";
import { UserInterface } from "@verto/js/dist/common/faces";
import { useRouter } from "next/router";
import { arPrice, isAddress, verto as client } from "../../../utils/arweave";
import { cardAnimation } from "../../../utils/animations";
import { AnimatePresence, motion } from "framer-motion";
import {
  fetchArtworkMetadata,
  fetchUserCreations,
} from "verto-cache-interface";
import { Art } from "../../../utils/user";
import { useState } from "react";
import Head from "next/head";
import Metas from "../../../components/Metas";
import InfiniteScroll from "react-infinite-scroll-component";
import styles from "../../../styles/views/user.module.sass";

const Creations = (props: {
  user: UserInterface | null;
  input: string;
  creations: Art[];
  ids: string[];
}) => {
  const router = useRouter();
  if (router.isFallback) return <></>;

  // artworks infinite loading
  const [creations, setCreations] = useState<Art[]>(props.creations);
  const [hasMore, setHasMore] = useState(
    props.ids.length > props.creations.length
  );

  async function loadMore() {
    if (!hasMore) return;

    let arts: Art[] = [];
    const nextArtsToLoad = props.ids.slice(
      creations.length,
      creations.length + 8
    );

    if (nextArtsToLoad.length <= 0) return setHasMore(false);

    for (const id of nextArtsToLoad) {
      const data = await fetchArtworkMetadata(id);
      //const price = (await arPrice()) * (await client.getPrice(id)).price;

      if (data.lister.image)
        data.lister.image = `https://arweave.net/${data.lister.image}`;

      arts.push({
        ...data,
        price: null,
      });
    }

    setCreations((val) => [...val, ...arts]);
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
      <InfiniteScroll
        dataLength={creations.length}
        next={loadMore}
        hasMore={hasMore}
        loader={<></>}
        className={styles.Creations}
        style={{ overflow: "unset !important" }}
      >
        {creations.map((art, i) => (
          <motion.div
            key={i}
            {...cardAnimation(i)}
            className={styles.CreationItem}
          >
            <Card.Asset
              name={art.name}
              userData={{
                avatar: art.lister.image,
                name: art.lister.name,
                usertag: art.lister.username,
              }}
              // @ts-ignore
              price={art.price ?? " ??"}
              image={`https://arweave.net/${art.id}`}
              onClick={() => router.push(`/space/${art.id}`)}
            />
          </motion.div>
        ))}
      </InfiniteScroll>
      <AnimatePresence>
        {hasMore && (
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
  const user = (await client.user.getUser(input)) ?? null;
  const creations: Art[] = [];

  // redirect if the user cannot be found and if it is not and address either
  if (!isAddress(input) && !user)
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
    };

  const ids = await fetchUserCreations(input);

  for (const id of ids.slice(0, 8)) {
    const data = await fetchArtworkMetadata(id);
    //const price = (await arPrice()) * (await client.getPrice(id)).price;

    if (data.lister.image)
      data.lister.image = `https://arweave.net/${data.lister.image}`;

    creations.push({
      ...data,
      price: null,
    });
  }

  return { props: { creations, user, input, ids }, revalidate: 1 };
}

export default Creations;
