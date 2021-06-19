import { Page, Spacer } from "@verto/ui";
import { UserInterface } from "@verto/js/dist/faces";
import { useRouter } from "next/router";
import { CACHE_URL } from "../../../utils/arweave";
import axios from "axios";
import Verto from "@verto/js";
import Head from "next/head";
import Metas from "../../../components/Metas";
import styles from "../../../styles/views/user.module.sass";

const client = new Verto();

const Creations = (props: {
  user: UserInterface | null;
  input: string;
  creations: string[];
}) => {
  const router = useRouter();
  if (router.isFallback) return <></>;

  return (
    <Page>
      <Head>
        <title>@{props.user?.username || props.input} - Creations</title>
        <Metas
          title="User"
          subtitle={`@${props.user?.username || props.input} - Creations`}
          image={
            (props.user?.image && `https://arweave.net/${props.user.image}`) ||
            undefined
          }
        />
        <meta
          property="profile:username"
          content={props.user?.username || props.input}
        />
      </Head>
      <Spacer y={3} />
      <h1 className="Title">All Creations</h1>
      <Spacer y={3} />
    </Page>
  );
};

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: "blocking",
  };
}

export async function getStaticProps({ params: { input } }) {
  const user = (await client.getUser(input)) ?? null;
  const { data: creations } = await axios.get(
    `${CACHE_URL}/user/${input}/creations`
  );

  return { props: { creations, user, input }, revalidate: 1 };
}

export default Creations;
