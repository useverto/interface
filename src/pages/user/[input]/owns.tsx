import { Card, Page, Spacer, Loading } from "@verto/ui";
import { UserInterface } from "@verto/js/dist/common/faces";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { useRouter } from "next/router";
import {
  arPrice,
  gateway,
  isAddress,
  verto as client,
} from "../../../utils/arweave";
import { cardAnimation } from "../../../utils/animations";
import { AnimatePresence, motion } from "framer-motion";
import { Art } from "../../../utils/user";
import { useState } from "react";
import { fetchArtworkMetadata, UserBalance } from "verto-cache-interface";
import Head from "next/head";
import Metas from "../../../components/Metas";
import InfiniteScroll from "react-infinite-scroll-component";
import styles from "../../../styles/views/user.module.sass";

const Owns = (props: Props) => {
  const router = useRouter();
  if (router.isFallback) return <></>;

  // owned arts infinite loading
  const [owned, setOwned] = useState(props.owned);
  const [hasMore, setHasMore] = useState(
    props.balances.length > props.owned.length
  );
  const [animationCounter, setAnimationCounter] = useState(0);

  async function loadMore() {
    if (!hasMore) return;

    let arts: Art[] = [];
    const nextArtsToLoad = props.balances.slice(owned.length, owned.length + 8);

    if (nextArtsToLoad.length <= 0) return setHasMore(false);

    setAnimationCounter(owned.length);

    for (const token of nextArtsToLoad) {
      const data = await fetchArtworkMetadata(token.contractId);
      //const price = (await arPrice()) * (await client.getPrice(id)).price;

      if (data.lister.image)
        data.lister.image = `${gateway()}/${data.lister.image}`;

      owned.push({
        id: token.contractId,
        name: token.name,
        lister: data.lister,
        price: null,
      });
    }

    setOwned((val) => [...val, ...arts]);
  }

  return (
    <Page>
      <Head>
        <title>
          @{props.user?.username || props.input} - Owned art {"&"} collectibles
        </title>
        <Metas
          title="User"
          subtitle={`@${
            props.user?.username || props.input
          } - Owned art & collectibles`}
          image={
            (props.user?.image && `${gateway()}/${props.user.image}`) ||
            undefined
          }
        />
        <meta
          property="profile:username"
          content={props.user?.username || props.input}
        />
      </Head>
      <Spacer y={3} />
      <h1 className="Title">Owned art {"&"} collectibles</h1>
      <Spacer y={3} />
      <InfiniteScroll
        dataLength={owned.length}
        next={loadMore}
        hasMore={hasMore}
        loader={<></>}
        className={styles.Creations}
        style={{ overflow: "unset !important" }}
      >
        {owned.map((art, i) => (
          <motion.div
            key={i}
            {...cardAnimation(i - animationCounter)}
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
              image={`${gateway()}/${art.id}`}
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

export async function getServerSideProps({
  params: { input },
}: GetServerSidePropsContext<{ input: string }>): Promise<
  GetServerSidePropsResult<Props>
> {
  const user = (await client.user.getUser(input)) ?? null;

  // redirect if the user cannot be found and if it is not and address either
  if (!isAddress(input) && !user) return { notFound: true };

  // load balances for all addresses and
  // filter them to sort out repeating owned
  // tokens
  const balances: UserBalance[] = [];

  for (const balance of await client.user.getBalances(input, "art")) {
    // continue if this token has already been added to the balances array
    if (balances.find(({ contractId }) => contractId === balance.contractId))
      continue;

    // push to balances
    // to allow json serialization
    // return null if the logo is undefined
    balances.push({
      ...balance,
      logo: balance.logo ?? null,
    });
  }

  const owned: Art[] = [];

  // load data for the first 8 tokens
  for (const token of balances.slice(0, 8)) {
    const data = await fetchArtworkMetadata(token.contractId);
    //const price = (await arPrice()) * (await client.getPrice(id)).price;

    if (data.lister.image)
      data.lister.image = `${gateway()}/${data.lister.image}`;

    owned.push({
      id: token.contractId,
      name: token.name,
      lister: data.lister,
      price: null,
    });
  }

  return {
    props: { owned, balances, user, input },
  };
}

export default Owns;

interface Props {
  user: UserInterface | null;
  input: string;
  owned: Art[];
  balances: UserBalance[];
}
