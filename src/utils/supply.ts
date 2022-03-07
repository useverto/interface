/**
 * Calculate the total supply of a token
 *
 * @param state Token contract state
 * @returns Total supply
 */
export function calculateTotalSupply(state: BaseTokenState) {
  let totalSupply = calculateCirculatingSupply(state);

  if (state.vault)
    for (const vault of Object.values(state.vault) as any) {
      totalSupply += vault
        .map((a: any) => a.balance)
        .reduce((a: number, b: number) => a + b, 0);
    }

  return totalSupply;
}

/**
 * Calculate the circulating supply of a token
 *
 * @param state Token contract state
 * @returns Circulating supply
 */
export function calculateCirculatingSupply(state: BaseTokenState) {
  return Object.values(state.balances).reduce((a, b) => a + b, 0);
}

export interface BaseTokenState {
  balances: {
    [address: string]: number;
  };
  vault?: {
    [address: string]: {
      balance: number;
      end: number;
      start: number;
    }[];
  };
  [key: string]: any;
}
