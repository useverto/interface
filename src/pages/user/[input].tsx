import Verto from "@verto/js";
import { UserInterface } from "@verto/js/dist/faces";
import { Avatar, Page } from "@verto/ui";

const client = new Verto();

const User = (props: { user: UserInterface | undefined }) => {
  console.log(props.user);

  return (
    <Page>
      {props.user && (
        <Avatar
          avatar={`https://arweave.net/${props.user.image}`}
          usertag={props.user.username}
          name={props.user.name}
          size="large-inline"
        />
      )}
    </Page>
  );
};

export async function getServerSideProps(context) {
  const { input } = context.query;
  const user = await client.getUser(input);

  return { props: { user } };
}

export default User;
