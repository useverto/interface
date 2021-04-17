import Verto from "@verto/js";
import { TradingPostInterface } from "@verto/js/dist/faces";
import { Card, Page, Spacer } from "@verto/ui";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

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
      {props.posts.map((post) => (
        <>
          <Card.TradingPost
            status={status[post.address] || "neutral"}
            address={post.address}
            balance={post.balance}
            vrtStake={post.stake}
            key={post.address}
            onClick={() => router.push(`/orbit/post/${post.address}`)}
          />
          <Spacer y={2} />
        </>
      ))}
    </Page>
  );
};

export async function getServerSideProps() {
  const res = await client.getTradingPosts();

  return { props: { posts: res } };
}

export default Orbit;
