import { PermissionType } from "arconnect";
import { useEffect, useState } from "react";
import useArconnect from "use-arconnect";

export const permissions: PermissionType[] = [
  "ACCESS_ADDRESS",
  "ACCESS_ALL_ADDRESSES",
  "SIGN_TRANSACTION",
];

export function useAddress() {
  const [address, setAddress] = useState<string>();
  const arconnect = useArconnect();

  useEffect(() => {
    if (!window.arweaveWallet) return;

    updateAddress();
    window.addEventListener("walletSwitch", updateAddress);

    return function cleanup() {
      window.removeEventListener("walletSwitch", updateAddress);
    };
  }, [arconnect]);

  async function updateAddress(e?: CustomEvent<{ address: string }>) {
    if (e) return setAddress(e.detail.address);
    try {
      setAddress(await window.arweaveWallet.getActiveAddress());
    } catch {}
  }

  return { address, updateAddress };
}
