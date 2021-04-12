import { Card, Page, Spacer } from "@verto/ui";
import axios from "axios";
import { useEffect, useState } from "react";

const Orbit = (props: { posts: any }) => {
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
          />
          <Spacer y={2} />
        </>
      ))}
    </Page>
  );
};

export async function getServerSideProps() {
  const { data: posts } = await axios.get(
    `https://v2.cache.verto.exchange/posts`
  );

  return { props: { posts } };
}

export default Orbit;
