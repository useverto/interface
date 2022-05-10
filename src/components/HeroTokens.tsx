import { CACHE_CONFIG, gateway } from "../utils/arweave";
import Marquee from "react-fast-marquee";
import Image from "next/image";
import styles from "../styles/components/HeroTokens.module.sass";

interface Props {
  images: string[];
  className?: string;
}

export default function HeroTokens({ images, ...props }: Props) {
  return (
    <div className={styles.Wrapper} {...props}>
      <div className={styles.TokensContainer}>
        {[20, 15, 10, 20].map((speed, s) => (
          <Marquee
            speed={speed}
            key={s}
            direction={!(s % 2) ? "left" : "right"}
            gradientWidth={50}
            pauseOnHover
            style={{ minWidth: "max-content" }}
          >
            {images.slice(s * 8, (s + 1) * 8).map((img, i) => (
              <div key={i} className={styles.Token}>
                <Image
                  className={styles.Logo}
                  src={`/communities/${img}`}
                  width={64}
                  height={64}
                  alt={`AR.${img}`}
                />
              </div>
            ))}
          </Marquee>
        ))}
      </div>
    </div>
  );
}

export async function fetchTokenLogos(): Promise<string[]> {
  // return await fetch(`${CACHE_CONFIG.CONTRACT_CDN}/tokens/skeletons.json`)
  //   .then((res) => res.json() as Promise<{ type: string; logo: string }[]>)
  //   .then((tokens) => tokens.filter((token) => token.type == 'community'))
  //   .then((tokens) => tokens.filter((token) => /[a-zA-Z0-9-_]{43}/.test(token.logo))) // filter out invalid logos
  //   .then((tokens) => tokens.map((token) => token.logo));

  return [
    "arverify.svg",
    "ardrive.svg",
    "verto.svg",
    "pianity.png",
    "decentland.png",
    "glass.png",
    "sarcophagus.png",
    "checkmynft.png",
    "weve.png",
    "argo.png",
    "everfinance.png",
    "communityxyz.png",
    "argora.png",
    "redstone.svg",
    "arwiki.png",
    "koii.svg",
    "pocketnetwork.png",
    "permabot.png",
    "wisdomwizards.png",
    "viewblock.png",
    "mirror.jpeg",
    "amplify.png",
    "aftrmarket.png",
    "gitcoin.svg",
    "arconnect.png",
    "ecclesia.jpeg",
    "arweavenews.jpeg",
    "kyve.svg",
    "nestland.jpeg",
    "evermore.png",
  ].sort(() => Math.random() - 0.5); // shuffle
}
