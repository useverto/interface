import { CLOB_CONTRACT, run } from "./arweave";

const pairQuery = `
  query($clobID: [String!]!, $after: String) {
    transactions(
      tags: [
        { name: "Exchange", values: "Verto" }
        { name: "Action", values: "AddPair" }
        { name: "Contract", values: $clobID }
        { name: "App-Name", values: "SmartWeaveAction" }
      ]
      after: $after
    ) {
      edges {
        cursor
        node {
          tags {
            name
            value
          }
          block {
            height
          }
        }
      }
    }
  }
`;

/**
 * Load interactions
 * @param pair
 * @param after
 */
export async function loadAddPairInteractions(
  pair: [string, string],
  after?: string
) {
  const res = await run(pairQuery, {
    clobID: CLOB_CONTRACT,
    after,
  });
}
