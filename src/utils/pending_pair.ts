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
      first: 100
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
 * Get if the pair has an "addPair" interaction pending.
 */
export async function pairAddPending(pair: [string, string]): Promise<boolean> {
  const hasInteraction = async (after?: string) => {
    try {
      const { data } = await run(pairQuery, {
        clobID: CLOB_CONTRACT,
        after,
      });
      const edges = data?.transactions?.edges ?? [];

      if (edges.length === 0) return false;

      for (const { node } of edges) {
        const input =
          node.tags.find(({ name }) => name === "Input")?.value ?? "";
        const interactionPair: [string, string] = JSON.parse(input).pair;

        // break if the pair is added or if there was already an interaction
        // that has been mined, that adds this pair
        // if that is the case, we should return false, because that interaction
        // must have failed
        // the reason for that is that we are already checking the clob contract
        // to find this pair, and if we did not find it, it indeed prooves that
        // the interaction failed
        if (
          pair.includes(interactionPair[0]) &&
          pair.includes(interactionPair[1])
        ) {
          return !node.block;
        }
      }

      return hasInteraction(edges[edges.length - 1]?.cursor);
    } catch {
      return false;
    }
  };

  return await hasInteraction();
}
