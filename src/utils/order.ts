import { Status } from "@verto/ui/dist/components/Card";

/**
 * Convert a status string to UI-friendly status
 *
 * @param statusString String to convert
 *
 * @returns status
 */
export const getStatus = (statusString: string): Status => {
  if (statusString === "success" || statusString === "pending")
    return statusString;
  else if (statusString === "cancelled" || statusString === "refunded")
    return "neutral";
  return "error";
};

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
