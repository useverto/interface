/**
 * Beautify addresses
 *
 * @param address Address to beautify
 *
 * @returns Formatted address
 */
export function formatAddress(address: string, length = 26) {
  if (!address) return "";

  return (
    address.substring(0, length / 2) +
    "..." +
    address.substring(address.length - length / 2, address.length)
  );
}

/**
 * Format Arweave balance
 *
 * @param val Number to format
 * @param short Return an even shorter format
 *
 * @returns Formatted balance
 */
export function formatArweave(val: number | string = 0, short = false) {
  if (Number(val) === 0 && !short) return "0".repeat(10);
  val = String(val);
  const full = val.split(".")[0];
  if (full.length >= 10) return full;
  if (short) {
    if (full.length >= 5) return full;
    else return val.slice(0, 5);
  }
  return val.slice(0, 10);
}
