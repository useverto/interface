import Verto from "@verto/js";
import { TradingPostInterface } from "@verto/js/dist/faces";
import { Card, Page, Spacer } from "@verto/ui";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cardListAnimation } from "../../utils/animations";
import Metas from "../../components/Metas";
import Head from "next/head";

const client = new Verto();

const Orbit = (props: { posts: TradingPostInterface[] }) => {
  const router = useRouter();
  const [status, setStatus] = useState({});

  useEffect(() => {
    (async () => {
      for (const post of props.posts) {
        let status;

        try {
          await fetch(post.endpoint);
          status = "online";
        } catch {
          status = "offline";
        }

        setStatus((val) => ({ ...val, [post.address]: status }));
      }
    })();
  }, []);

  return (
    <Page>
      <Head>
        <title>Verto - Orbit</title>
        <Metas title="Orbit" />
      </Head>
      <Spacer y={3} />
      {props.posts
        .sort((a, b) => b.stake - a.stake)
        .map((post, i) => (
          <motion.div key={i} {...cardListAnimation(i)}>
            <Card.TradingPost
              status={status[post.address] || "neutral"}
              address={post.address}
              balance={post.balance}
              vrtStake={post.stake}
              onClick={() => router.push(`/orbit/post/${post.address}`)}
            />
            <Spacer y={2} />
          </motion.div>
        ))}
    </Page>
  );
};

export async function getServerSideProps() {
  const res = await client.getTradingPosts();

  return { props: { posts: res } };
}

export default Orbit;
