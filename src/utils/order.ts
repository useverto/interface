import { cancelCache } from "./storage_names";

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

/**
 * Add an order to the cached cancelled orders list
 *
 * @param orderID Order cancelled
 */
export const addToCancel = (orderID: string) => {
  localStorage.setItem(
    cancelCache,
    JSON.stringify([...getCancelledOrders(), orderID])
  );
};

/**
 * Get cancelled order ids
 *
 * @returns Array of order ids
 */
export const getCancelledOrders = (): string[] => {
  const stored = localStorage.getItem(cancelCache);
  if (!stored) return [];

  return JSON.parse(stored);
};

export type OrderType = "market" | "limit";
