import Marquee from "react-fast-marquee";
import Image from "next/image";
import styles from "../styles/components/HeroTokens.module.sass";

interface Props {
  images: string[];
  className?: string;
}

export default function HeroTokens(props: Props) {
  return (
    <div className={styles.Wrapper}>
      <div className={styles.TokensContainer}>
        {[20, 15, 10, 20].map((speed, s) => (
          <Marquee
            speed={speed}
            key={s}
            direction={!(s % 2) ? "left" : "right"}
            gradient={false}
            pauseOnHover
          >
            {props.images.slice(s * 5, (s + 1) * 5).map((img, i) => (
              <div key={i} className={styles.Token}>
                <Image
                  className={styles.Logo}
                  src={`https://arweave.net/${img}`}
                  width={64}
                  height={64}
                  alt={`token ${i}`}
                />
              </div>
            ))}
          </Marquee>
        ))}
      </div>
    </div>
  );
}

export async function fetchTokenLogos() {
  return await fetch(
    "https://storage.googleapis.com/verto-exchange-contracts/tokens/skeletons.json"
  )
    .then((res) => res.json())
    .then((tokens) => tokens.filter((token) => token.type == "community"))
    .then((tokens) =>
      tokens.filter((token) => /[a-zA-Z0-9-_]{43}/.test(token.logo))
    ) // filter out invalid logos
    .then((tokens) => tokens.map((token) => token.logo));
}

// TODO(@maximousblk): remove this before merging
fetchTokenLogos().then((tokens) => {
  console.log(tokens, tokens.length);
});
