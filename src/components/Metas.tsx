import { ROOT_URL } from "../utils/arweave";

const Metas = ({ title, image, subtitle, localImage }: MetaProps) => (
  <>
    <meta name="title" content={`Verto - ${title} ${subtitle ?? ""}`} />
    <meta
      name="description"
      content="A decentralized trading protocol on Arweave."
    />

    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://verto.exchange/" />
    <meta property="og:title" content={`Verto - ${title} ${subtitle ?? ""}`} />
    <meta
      property="og:image"
      content={
        image ??
        (localImage
          ? `${ROOT_URL}/${localImage}`
          : `${ROOT_URL}/api/og?title=${
              title + ((subtitle && "&subtitle=" + subtitle) || "")
            }`)
      }
    />
    <meta
      property="og:description"
      content="A decentralized trading protocol on Arweave."
    />

    <meta
      property="twitter:card"
      content={image ? "summary" : "summary_large_image"}
    />
    <meta property="twitter:url" content="https://verto.exchange/" />
    <meta
      property="twitter:title"
      content={`Verto - ${title} ${subtitle ?? ""}`}
    />
    <meta
      property="twitter:image"
      content={
        image ??
        (localImage
          ? `${ROOT_URL}/${localImage}`
          : `${ROOT_URL}/api/og?title=${
              title + ((subtitle && "&subtitle=" + subtitle) || "")
            }`)
      }
    />
    <meta
      property="twitter:description"
      content="A decentralized trading protocol on Arweave."
    />
  </>
);

export default Metas;

interface MetaProps {
  title: string;
  image?: string;
  subtitle?: string;
  localImage?: string;
}
