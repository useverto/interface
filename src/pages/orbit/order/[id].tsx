import { Card, Page, Spacer } from "@verto/ui";
import axios from "axios";

const Order = (props: { order: any }) => {
  return (
    <Page>
      {props.order.actions.map((action) => (
        <>
          <Card.OrderStep
            title={action.description}
            id={action.id}
            matchID={action.match}
            link={`https://viewblock.io/arweave/tx/${action.id}`}
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
