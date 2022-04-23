import { Page, Spacer, Tooltip, useTheme, useToasts } from "@verto/ui";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  BoxIcon,
  CheckCircleIcon,
  CloseCircleIcon,
  DownloadIcon,
} from "@iconicicons/react";
import { fetchContract } from "verto-cache-interface";
import { gateway } from "../../utils/arweave";
import Head from "next/head";
import Metas from "../Metas";
import styles from "../../styles/views/community.module.sass";

const Other = (props: Props) => {
  const router = useRouter();
  if (router.isFallback) return <></>;

  const theme = useTheme();
  const { setToast } = useToasts();

  // load state
  const [state, setState] = useState<
    Props & {
      [key: string]: any;
    }
  >();

  useEffect(() => {
    (async () => {
      try {
        const contractState = await fetchContract<typeof state>(props.id);

        setState(contractState.state);
      } catch {
        setToast({
          description: "Could not load token state",
          type: "error",
          duration: 3000,
        });
      }
    })();
  }, [props.id]);

  return (
    <Page>
      <Spacer y={3} />
      <Head>
        <title>Verto - {props.name}</title>
        <Metas title={props.name} />
      </Head>
      <div className={styles.TokenDetails}>
        <h1 className={styles.Name}>
          {props.name}
          <span
            className={
              styles.Ticker + " " + (theme === "Dark" ? styles.DarkTicker : "")
            }
          >
            {props.ticker}
          </span>
        </h1>
        <Spacer y={1} />
        <p className={styles.Paragraph}>
          This asset is not supported by the token preview. See it's state
          below.
        </p>
        <Spacer y={1.35} />
        {state && (
          <>
            <Tooltip
              text={
                (state?.invocations &&
                  state?.foreignCalls &&
                  "Token supports FCP") ||
                "Token does not support FCP"
              }
              position="right"
            >
              <a
                href="https://www.notion.so/Foreign-Call-Protocol-Specification-61e221e5118a40b980fcaade35a2a718"
                className={styles.Data}
                target="_blank"
                rel="noopener noreferrer"
              >
                {(state?.invocations && state?.foreignCalls && (
                  <>
                    <CheckCircleIcon />
                    Tradeable
                  </>
                )) || (
                  <>
                    <CloseCircleIcon />
                    Not tradeable
                  </>
                )}
              </a>
            </Tooltip>
            <a
              href={`https://viewblock.io/arweave/address/${props.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.Data}
            >
              <BoxIcon />
              Viewblock
            </a>
            <a
              href={`${gateway()}/${props.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.Data}
            >
              <DownloadIcon />
              Download
            </a>
          </>
        )}
        <Spacer y={1.35} />
        {state && (
          <pre className={styles.StateViewer}>
            <code>{JSON.stringify(state, null, 2)}</code>
          </pre>
        )}
      </div>
    </Page>
  );
};

export default Other;

interface Props {
  id: string;
  name: string;
  ticker: string;
}
