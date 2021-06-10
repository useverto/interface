import { Card, Page, Spacer, Tooltip } from "@verto/ui";
import { useRouter } from "next/router";
import { cardListAnimation } from "../../../utils/animations";
import { motion } from "framer-motion";
import { getType } from "../../../utils/order";
import { CACHE_URL } from "../../../utils/arweave";
import axios from "axios";
import Head from "next/head";
import Metas from "../../../components/Metas";
import Link from "next/link";
import useSWR from "swr";
import styles from "../../../styles/views/orbit.module.sass";

const Order = (props: { order: any; id: string }) => {
  const router = useRouter();
  if (router.isFallback) return <></>;

  const { data: order } = useSWR(
    "getOrder",
    async () => {
      const { data } = await axios.get(`${CACHE_URL}/order/${props.id}`);
      return data;
    },
    {
      initialData: props.order,
    }
  );

  return (
    <Page>
      <Head>
        <title>Verto - Order {props.id}</title>
        <Metas title="Order" subtitle={props.id} />
      </Head>
      <Spacer y={3} />
      <div className={styles.OrbitTitle}>
        <h1>
          Order
          <span className={styles.Type}>{getType(order.input)}</span>
        </h1>
        <p>
          {order.id}
          <Spacer x={0.44} />
          <Tooltip text={order.status} position="right">
            <span
              className={styles.Status + " " + styles[`Status_${order.status}`]}
            />
          </Tooltip>
        </p>
        <p>
          Owner:
          <Link href={`/@${order.sender}`}>{order.sender}</Link>
        </p>
      </div>
      <Spacer y={3} />
      {order.actions.map((action, i) => (
        <motion.div key={i} {...cardListAnimation(i)}>
          <Card.OrderStep
            title={action.description}
            id={action.id}
            matchID={action.match}
            link={`https://viewblock.io/arweave/tx/${action.id}`}
          />
          <Spacer y={2} />
        </motion.div>
      ))}
    </Page>
  );
};

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: "blocking",
  };
}

export async function getStaticProps({ params: { id } }) {
  const { data: order } = await axios.get(`${CACHE_URL}/order/${id}`);

  return { props: { order, id }, revalidate: 1 };
}

export default Order;
