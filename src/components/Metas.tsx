const Metas = ({ title, image }: MetaProps) => (
  <>
    <meta name="title" content={`Verto - ${title}`} />
    <meta
      name="description"
      content="A decentralized trading protocol on Arweave."
    />

    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://verto.exchange/" />
    <meta property="og:title" content={`Verto - ${title}`} />
    <meta
      property="og:image"
      content={image ?? "https://verto.exchange/logo_light.svg"}
    />
    <meta
      property="og:description"
      content="A decentralized trading protocol on Arweave."
    />

    <meta property="twitter:card" content="summary" />
    <meta property="twitter:url" content="https://verto.exchange/" />
    <meta property="twitter:title" content={`Verto - ${title}`} />
    <meta
      property="twitter:image"
      content={image ?? "https://verto.exchange/logo_light.svg"}
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
}
