import { isAddress, verto as client } from "../../utils/arweave";
import {
  fetchCollectionById,
  fetchContract,
  fetchUserByUsername,
} from "verto-cache-interface";
import axios from "axios";
import Community from "../../components/space/Community";
import Collection from "../../components/space/Collection";
import Art from "../../components/space/Art";

const Token = (props) => {
  // TODO: custom layout

  return (
    <>
      {(props.type === "community" && <Community {...props} />) ||
        (props.type === "collection" && <Collection {...props} />) || (
          <Art {...props} />
        )}
    </>
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

  const type = await client.token.getTokenType(id);

  if (!type)
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
    };

  if (type === "collection") {
    const data = await fetchCollectionById(id);
    const ownerData = await fetchUserByUsername(data.owner);

    return {
      props: {
        ...data,
        type: "collection",
        owner: ownerData,
      },
      revalidate: 1,
    };
  } else {
    const { state } = await fetchContract(id);
    // TODO: price
    //const res = await client.getPrice(id);

    const { data: gecko } = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd"
    );

    return {
      props: {
        id,
        name: state.name,
        ticker: state.ticker,
        //price: res ? res.price * gecko.arweave.usd : "--",
        price: "--",
        type: type || "community",
      },
      revalidate: 1,
    };
  }
}

export default Token;
