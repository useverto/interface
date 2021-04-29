import { Card, Page, Spacer } from "@verto/ui";
import { useRouter } from "next/router";
import axios from "axios";
import Head from "next/head";
import Metas from "../../../components/Metas";

const Order = (props: { order: any }) => {
  const router = useRouter();

  return (
    <Page>
      <Head>
        <title>Verto - Order {router.query.id}</title>
        <Metas title={`Order ${router.query.id}`} />
      </Head>
      {props.order.actions.map((action, i) => (
        <>
          <Card.OrderStep
            title={action.description}
            id={action.id}
            matchID={action.match}
            link={`https://viewblock.io/arweave/tx/${action.id}`}
            key={i}
          />
          <Spacer y={2} />
        </>
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
