import { Card, Page, Spacer, Tooltip } from "@verto/ui";
import { useRouter } from "next/router";
import { cardListAnimation } from "../../../utils/animations";
import { motion } from "framer-motion";
import { getStatus, getType } from "../../../utils/order";
import axios from "axios";
import Head from "next/head";
import Metas from "../../../components/Metas";
import Link from "next/link";
import styles from "../../../styles/views/orbit.module.sass";

const Order = (props: { order: any }) => {
  const router = useRouter();

  return (
    <Page>
      <Head>
        <title>Verto - Order {router.query.id}</title>
        <Metas title={`Order ${router.query.id}`} />
      </Head>
      <Spacer y={3} />
      <div className={styles.OrbitTitle}>
        <h1>
          Order
          <span className={styles.Type}>{getType(props.order.input)}</span>
        </h1>
        <p>
          {props.order.id}
          <Spacer x={0.44} />
          <Tooltip text={getStatus(props.order.status)} position="right">
            <span
              className={
                styles.Status +
                " " +
                styles[`Status_${getStatus(props.order.status)}`]
              }
            />
          </Tooltip>
        </p>
        <p>
          Owner:
          <Link href={`/@${props.order.sender}`}>{props.order.sender}</Link>
        </p>
      </div>
      <Spacer y={3} />
      {props.order.actions.map((action, i) => (
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

export async function getServerSideProps(context) {
  const { id } = context.query;

  const { data: order } = await axios.get(
    `https://v2.cache.verto.exchange/order/${id}`
  );

  return { props: { order } };
}

export default Order;
