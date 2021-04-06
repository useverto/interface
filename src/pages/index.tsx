import axios from "axios";
import { useEffect, useState } from "react";

const Home = (props: { communities: any }) => {
  const [communities, setCommunities] = useState([]);

  useEffect(() => {
    axios
      .get("https://v2.cache.verto.exchange/site/communities")
      .then((res) => setCommunities(res.data));
  }, []);

  console.log(communities);

  return <></>;
};

// export async function getServerSideProps() {
//   const { data: communities } = await axios.get(
//     "https://v2.cache.verto.exchange/site/communities"
//   );

//   return {
//     props: {
//       communities,
//     },
//   };
// }

export default Home;
