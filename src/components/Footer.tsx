import { Page, Spacer, useTheme, useToasts } from "@verto/ui";
import { useEffect, useState } from "react";
import { gateway, client, COMMUNITY_CONTRACT } from "../utils/arweave";
import { fetchContract } from "verto-cache-interface";
import Image from "next/image";
import Twitter from "./icons/Twitter";
import Github from "./icons/Github";
import axios from "axios";
import Discord from "./icons/Discord";
import Linkedin from "./icons/Linkedin";
import styles from "../styles/components/Footer.module.sass";

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
      <div className={styles.FooterLinks}>
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
            href="https://npmjs.com/@verto/js"
            target="_blank"
            rel="noopener noreferrer"
          >
            Library
          </a>
          <a
            href="https://blog.th8ta.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Blog
          </a>
          <a
            href="https://github.com/useverto/interface"
            target="_blank"
            rel="noopener noreferrer"
          >
            Code
          </a>
          <a
            href="https://github.com/useverto/contracts"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contracts
          </a>
        </div>
        <div className={styles.Links}>
          <span className={styles.Title}>Company</span>
          <a href="https://th8ta.org" target="_blank" rel="noopener noreferrer">
            th8ta
          </a>
          <a
            href="https://arconnect.io"
            target="_blank"
            rel="noopener noreferrer"
          >
            ArConnect
          </a>
          <a href="https://3em.dev" target="_blank" rel="noopener noreferrer">
            3em
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
      </div>
      <div className={styles.SocialRow}>
        <a
          href="https://twitter.com/vertoexchange"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Twitter fill />
        </a>
        <a
          href="https://twitter.com/vertoexchange"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github fill />
        </a>
        <a
          href="https://verto.exchange/chat"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Discord />
        </a>
        <a
          href="https://www.linkedin.com/company/th8ta/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Linkedin />
        </a>
      </div>
      <p className={styles.Copyright}>
        Copyright (c) {new Date().getFullYear()}. All rights reserved
      </p>
    </Page>
  );
};

export default Footer;
