import { UserInterface } from "@verto/js/dist/faces";
import { generateAvatarGradient } from "@verto/ui";

export function randomEmoji(size = 100) {
  const emojis = ["😂", "🥺", "😊", "🥰", "😃", "🤩", "🤔", "😏", "😷"];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];

  return `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 ${size} ${size}%22><text x=%22${
    size / 2
  }%22 y=%22${
    (size / 100) * 60
  }%22 alignment-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%22${
    (size / 100) * 70
  }%22>${emoji}</text></svg>`;
}

export interface Art {
  id: string;
  name: string;
  price?: number;
  owner: UserInterface;
}

export type TokenType = "community" | "art" | "collection" | "custom";

export const fixUserImage = (user: UserInterface) => ({
  ...user,
  image: user?.image
    ? `https://arweave.net/${user.image}`
    : generateAvatarGradient(user.name || user.username || ""),
});
