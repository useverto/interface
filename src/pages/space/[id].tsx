import { Page } from "@verto/ui";
import { CACHE_URL, isAddress, verto as client } from "../../utils/arweave";
import Verto from "@verto/js";
import axios from "axios";
import Community from "../../components/space/Community";
import Collection from "../../components/space/Collection";
import Art from "../../components/space/Art";

const Token = (props) => {
  // TODO: custom layout

  return (
    <Page>
      {(props.type === "community" && <Community {...props} />) ||
        (props.type === "collection" && <Collection {...props} />) || (
          <Art {...props} />
        )}
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
  if (!isAddress(id))
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
    };

  const {
    data: { type, id: returnedID },
  } = await axios.get(`${CACHE_URL}/site/type/${id}`);

  if (!type && !returnedID)
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
    };

  if (type === "collection") {
    const { data } = await axios.get(`${CACHE_URL}/site/collection/${id}`);

    return {
      props: {
        ...data,
        type: "collection",
      },
      revalidate: 1,
    };
  } else {
    const {
      data: { state },
    } = await axios.get(`${CACHE_URL}/${id}`);
    const res = await client.getPrice(id);

    const { data: gecko } = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd"
    );

    return {
      props: {
        id,
        name: state.name,
        ticker: state.ticker,
        price: res ? res.price * gecko.arweave.usd : "--",
        type: type || "community",
      },
      revalidate: 1,
    };
  }
}

export default Token;
