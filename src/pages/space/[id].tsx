import {
  isAddress,
  USD_STABLECOIN_ID,
  verto as client,
} from "../../utils/arweave";
import {
  fetchCollectionById,
  fetchContract,
  fetchLatestPrice,
  fetchUserByUsername,
} from "verto-cache-interface";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import Community, {
  PropTypes as TokenProps,
} from "../../components/space/Community";
import Collection, { CollectionProps } from "../../components/space/Collection";
import Art from "../../components/space/Art";
import Other from "../../components/space/Other";

const Token = (props) => {
  return (
    <>
      {(props.type === "community" && <Community {...props} />) ||
        (props.type === "collection" && <Collection {...props} />) ||
        (props.type === "art" && <Art {...props} />) || <Other {...props} />}
    </>
  );
};

export async function getServerSideProps({
  params: { id },
}: GetServerSidePropsContext<{ id: string }>): Promise<
  GetServerSidePropsResult<TokenProps | CollectionProps>
> {
  if (!isAddress(id))
    return {
      notFound: true,
    };

  const type = await client.token.getTokenType(id);

  if (!type)
    return {
      notFound: true,
    };

  if (type === "collection") {
    try {
      const data = await fetchCollectionById(id);
      const ownerData = await fetchUserByUsername(data.owner);

      return {
        props: {
          ...data,
          type: "collection",
          owner: ownerData,
        },
      };
    } catch {
      return {
        notFound: true,
      };
    }
  } else {
    try {
      // fetch token
      const { state } = await fetchContract(id);
      // fetch price
      let price: number | "--" = "--";

      try {
        const priceData = await fetchLatestPrice([id, USD_STABLECOIN_ID]);

        // determinate price based on the dominant token
        // TODO: update this
        if (priceData?.dominantToken === id) {
          price = priceData.vwap;
        } else if (priceData?.dominantToken === USD_STABLECOIN_ID) {
          price = 1 / priceData.vwap;
        }
      } catch {}

      return {
        props: {
          id,
          name: state.name,
          ticker: state.ticker,
          price,
          type: type || "community",
        },
      };
    } catch {
      return {
        notFound: true,
      };
    }
  }
}

export default Token;
