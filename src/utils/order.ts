/**
 * Get the type of an order
 *
 * @param input Order input string
 *
 * @returns Buy / Sell
 */
export const getType = (input: string): "buy" | "sell" => {
  if (input.split(" ")[input.split.length - 1] === "AR") return "buy";
  return "sell";
};
