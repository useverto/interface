import { Page, useTheme, useToasts } from "@verto/ui";
import { useEffect, useState } from "react";
import { gateway, client, COMMUNITY_CONTRACT } from "../utils/arweave";
import { fetchContract } from "verto-cache-interface";
import Image from "next/image";
import styles from "../styles/components/Footer.module.sass";
import axios from "axios";

const Footer = () => {
  const theme = useTheme();
  const { setToast } = useToasts();

  // check gateway status
  const [status, setStatus] = useState<{
    status: "Up" | "Down" | "Warning";
    text: string;
  }>();

  useEffect(() => {
    (async () => {
      let gatewayUp = false;
      let cacheUp = false;

      // get gateway status
      try {
        const { status } = await axios.get(gateway());

        gatewayUp = status === 200;
      } catch (e) {
        gatewayUp = false;

        console.error("Gateway logs:", e);
        setToast({
          description: `The ${client.getConfig().api.host} gateway is down`,
          type: "error",
          duration: 7000,
        });
      }

      // get cache status
      try {
        await fetchContract(COMMUNITY_CONTRACT);

        cacheUp = true;
      } catch (e) {
        cacheUp = false;

        console.error("Cache logs:", e);
        setToast({
          description: "The cache server is down",
          type: "error",
          duration: 7000,
        });
      }

      if (gatewayUp && cacheUp) {
        setStatus({
          status: "Up",
          text: "All systems operational",
        });
      } else if (gatewayUp && !cacheUp) {
        setStatus({
          status: "Warning",
          text: "Cache outage",
        });
      } else if (!gatewayUp && cacheUp) {
        setStatus({
          status: "Warning",
          text: "Gateway outage",
        });
      } else {
        setStatus({
          status: "Down",
          text: "All systems down",
        });
      }
    })();
  }, []);

  return (
    <Page
      className={styles.Footer + " " + (theme === "Dark" ? styles.Dark : "")}
    >
      <Image
        className={styles.Logo}
        src="/logo_dark.svg"
        width={60}
        height={60}
        draggable={false}
      />
      <div className={styles.Links}>
        <span className={styles.Title}>About</span>
        <a
          href="https://verto.exchange/chat"
          target="_blank"
          rel="noopener noreferrer"
        >
          Chat
        </a>
        <a
          href="https://github.com/useverto/verto"
          target="_blank"
          rel="noopener noreferrer"
        >
          Code
        </a>
        <a href="https://arweave.org" target="_blank" rel="noopener noreferrer">
          Arweave
        </a>
      </div>
      <div className={styles.Links}>
        <span className={styles.Title}>Support</span>
        <a
          href="https://verto.exchange/chat"
          target="_blank"
          rel="noopener noreferrer"
        >
          Chat
        </a>
        <a
          href="https://github.com/useverto/verto"
          target="_blank"
          rel="noopener noreferrer"
        >
          Code
        </a>
        <a href="https://arweave.org" target="_blank" rel="noopener noreferrer">
          Arweave
        </a>
      </div>
      <div className={styles.Status}>
        Status:
        <span
          className={[
            styles.StatusCircle,
            (status && styles[status.status]) || "",
          ]
            .filter((val) => val !== "")
            .join(" ")}
        />
        <span
          className={[
            styles.StatusText,
            (status && styles[status.status]) || "",
          ]
            .filter((val) => val !== "")
            .join(" ")}
        >
          {status?.text || "Unknown"}
        </span>
      </div>
    </Page>
  );
};

export default Footer;
