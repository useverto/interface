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

/**
 * Get the date today
 *
 * @returns First milisecond date of today
 */
export function today() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today;
}

/**
 * Get the next day for a date
 *
 * @param today The date to get the next day for
 * @returns The next day
 */
export function nextDay(today: Date) {
  const date = new Date(today);
  date.setHours(0, 0, 0, 0);
  date.setDate(new Date(date).getDate() + 1);

  return date;
}

/**
 * Shuffle an array
 *
 * @param array Array to shuffle
 * @returns Random ordered array
 */
export function shuffleArray<T>(array: T[]): T[] {
  let copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

/**
 * Return 0 if the value is NaN
 * @param val Value to check
 */
export const isNanNull = (val) => (Number.isNaN(val) ? 0 : val);
