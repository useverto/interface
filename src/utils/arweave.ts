import Arweave from "arweave";

const client = new Arweave({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

export const fetchAsset = async (id: string): Promise<string> => {
  const tx = await client.transactions.get(id);

  let type: string;
  tx.tags.forEach((tag) => {
    const key = tag.get("name", { decode: true, string: true });
    const value = tag.get("value", { decode: true, string: true });

    if (key === "Content-Type") {
      type = value;
    }
  });

  const asset =
    `data:${type};base64,` +
    btoa(tx.data.reduce((data, byte) => data + String.fromCharCode(byte), ""));

  return asset;
};
