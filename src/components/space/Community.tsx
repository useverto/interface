import {
  Button,
  Card,
  Input,
  Loading,
  Page,
  Spacer,
  Tooltip,
  useInput,
  useTheme,
  useToasts,
} from "@verto/ui";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { GraphDataConfig, GraphOptions } from "../../utils/graph";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { RootState } from "../../store/reducers";
import { gateway, supportsFCP, verto as client } from "../../utils/arweave";
import { TokenType } from "../../utils/user";
import { fetchContract } from "verto-cache-interface";
import {
  calculateCirculatingSupply,
  calculateTotalSupply,
} from "../../utils/supply";
import { AnimatePresence, motion } from "framer-motion";
import { cardListAnimation } from "../../utils/animations";
import {
  BankIcon,
  BoxIcon,
  CheckCircleIcon,
  CloseCircleIcon,
  DollarIcon,
  LinkIcon,
  MessageIcon,
  RefreshIcon,
  UsersIcon,
} from "@iconicicons/react";
import { StarFillIcon, StarIcon } from "@primer/octicons-react";
import { watchlist as watchlist_store } from "../../utils/storage_names";
import isTomorrow from "dayjs/plugin/isTomorrow";
import Head from "next/head";
import Metas from "../../components/Metas";
import dayjs from "dayjs";
import axios from "axios";
import styles from "../../styles/views/community.module.sass";

dayjs.extend(isTomorrow);

const Community = (props: PropTypes) => {
  const router = useRouter();
  if (router.isFallback) return <></>;

  const periods = ["24h", "1w", "1m", "1y", "ALL"];
  const [selectedPeriod, setSelectedPeriod] = useState<string>("ALL");
  const [state, setState] = useState(null);
  const theme = useTheme();
  const address = useSelector((state: RootState) => state.addressReducer);

  useEffect(() => {
    fetchContract(props.id).then(({ state }) => {
      if (state.settings)
        state.settings = Object.fromEntries(new Map(state.settings));

      setState(state);
    });
  }, [props.id]);

  // reset periods on id change
  useEffect(() => setSelectedPeriod("ALL"), [props.id]);

  // load history
  const [history, setHistory] = useState<
    {
      date: string;
      price: number;
    }[]
  >();

  useEffect(() => {
    (async () => {
      // TODO: price history
      //const priceHistory = await client.getPriceHistory(props.id);
      const priceHistory = {
        "2022.03.01": 10,
        "2022.03.02": 5,
        "2022.03.03": 3,
        "2022.03.04": 7,
        "2022.03.05": 12,
      };
      const filterDates = (date) => {
        if (dayjs(new Date(date)).isTomorrow()) return false;

        const timeType =
          (selectedPeriod === "24h" && "day") ||
          (selectedPeriod === "1w" && "week") ||
          (selectedPeriod === "1m" && "month") ||
          "year";

        if (selectedPeriod === "ALL") return true;
        return dayjs(new Date(date)).isAfter(dayjs().subtract(1, timeType));
      };
      const prices = Object.keys(priceHistory)
        .filter((date) => filterDates(date))
        .map((key) => ({
          date: key,
          price: priceHistory[key],
        }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      // TODO: price history
      // setHistory(prices);
    })();
  }, [selectedPeriod]);

  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (!state) return;
    const totalSupply = calculateTotalSupply(state);
    const marketCap =
      props.price === "--"
        ? 0
        : (totalSupply * props.price).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

    setMetrics({
      marketCap,
      circulatingSupply: calculateCirculatingSupply(state).toLocaleString(),
      totalSupply: totalSupply.toLocaleString(),
    });
  }, [state]);

  const amount = useInput<number>();
  const target = useInput<string>();

  const { setToast } = useToasts();
  const [transferring, setTransferring] = useState(false);

  const transfer = async () => {
    if (amount.state <= 0) return amount.setStatus("error");

    if (target.state === "") return target.setStatus("error");

    const balances = await client.user.getBalances(address);
    const tokenBalance = balances.find(
      ({ contractId }) => contractId === props.id
    );

    if (!tokenBalance || tokenBalance.balance < amount.state)
      return amount.setStatus("error");

    setTransferring(true);

    try {
      await client.token.transfer(amount.state, props.id, target.state);
      setToast({
        description: `Transferring ${amount.state.toLocaleString()} ${
          props.ticker
        }`,
        type: "success",
        duration: 2600,
      });
    } catch (e) {
      console.error(
        "Error transferring token: \n",
        "Message: ",
        e,
        "\n",
        "Stack: \n",
        "Token: \n",
        props.id,
        "\n",
        "Target: \n",
        target.state,
        "\n",
        "Amount: \n",
        amount.state
      );
      setToast({
        description: `Could not transfer ${props.ticker}`,
        type: "success",
        duration: 2600,
      });
    }

    setTransferring(false);
  };

  // load logo
  const [logo, setLogo] = useState(
    // @ts-expect-error
    client.token.getLogo(props.id, theme.toLowerCase())
  );

  useEffect(() => {
    (async () => {
      if (!state)
        return setLogo(
          // @ts-expect-error
          client.token.getLogo(props.id, theme.toLowerCase())
        );
      else {
        const cryptometaURI = client.token.getLogo(
          props.id,
          // @ts-expect-error
          theme.toLowerCase()
        );
        const res = await axios.get(cryptometaURI);
        const logoInState = state.settings?.communityLogo;

        if (res.status !== 200 && logoInState) {
          setLogo(`${gateway()}/${logoInState}`);
        } else {
          setLogo(cryptometaURI);
        }
      }
    })();
  }, [theme, state]);

  // get if added to the watchlist
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    const watchlist = JSON.parse(localStorage.getItem(watchlist_store) || "[]");

    setFavorite(watchlist.includes(props.id));
  }, [state]);

  // toggle favorite
  function toggleInWatchlist() {
    const watchlist = JSON.parse(localStorage.getItem(watchlist_store) || "[]");
    const index = watchlist.indexOf(props.id);

    if (index > -1) watchlist.splice(index, 1);
    else watchlist.push(props.id);

    localStorage.setItem(watchlist_store, JSON.stringify(watchlist));

    setFavorite(!favorite);
  }

  return (
    <Page>
      <Head>
        <title>Verto - {props.name}</title>
        <Metas title={props.name} localImage={`api/token_og?id=${props.id}`} />
      </Head>
      <Spacer y={3} />
      <div className={styles.Wrapper}>
        <div className={styles.TokenDetails}>
          <h1 className={styles.Name}>
            <img
              className={styles.Logo}
              src={logo}
              alt="logo"
              draggable={false}
            />
            {props.name}
            <span
              className={
                styles.Ticker +
                " " +
                (theme === "Dark" ? styles.DarkTicker : "")
              }
            >
              {props.ticker}
            </span>
            <div
              className={
                styles.AddToWatchlist + " " + ((favorite && styles.Added) || "")
              }
              onClick={toggleInWatchlist}
            >
              {(favorite && <StarFillIcon />) || <StarIcon />}
            </div>
          </h1>
          {(props.price !== "--" && (
            <>
              <Spacer y={0.5} />
              <h1 className={styles.Price}>
                $
                {props.price.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </h1>
              <Spacer y={3.75} />
              {history && (
                <>
                  <div
                    className={
                      styles.PeriodMenu +
                      " " +
                      (theme === "Dark" ? styles.DarkPeriodMenu : "")
                    }
                  >
                    <AnimatePresence>
                      {periods.map((per, i) => (
                        <motion.span
                          key={i}
                          className={
                            selectedPeriod === per ? styles.Selected : ""
                          }
                          onClick={() => setSelectedPeriod(per)}
                          {...cardListAnimation(i)}
                        >
                          {per}
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                  <Spacer y={1.5} />
                  <div className={styles.Graph}>
                    <Line
                      data={{
                        labels: history.map(({ date }) => date),
                        datasets: [
                          {
                            data: history.map(({ price }) => price),
                            ...GraphDataConfig,
                            borderColor:
                              theme === "Light" ? "#000000" : "#ffffff",
                          },
                        ],
                      }}
                      options={GraphOptions({
                        theme,
                        tooltipText: ({ value }) =>
                          `${Number(value).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          })} AR`,
                      })}
                    />
                  </div>
                  <Spacer y={1.5} />
                </>
              )}
            </>
          )) || <Spacer y={3.75} />}
          <h1 className="Title">About</h1>
          <Spacer y={1} />
          <p className={styles.Paragraph}>
            {state?.settings?.communityDescription ||
              state?.description ||
              (state && "No community description available...") || (
                <>
                  <Loading.Skeleton
                    style={{
                      width: "100%",
                      marginBottom: ".5em",
                      height: "1.35em",
                    }}
                  />
                  <Loading.Skeleton
                    style={{
                      width: "100%",
                      marginBottom: ".5em",
                      height: "1.35em",
                    }}
                  />
                  <Loading.Skeleton
                    style={{
                      width: "100%",
                      marginBottom: ".5em",
                      height: "1.35em",
                    }}
                  />
                  <Loading.Skeleton
                    style={{ width: "85%", height: "1.35em" }}
                  />
                </>
              )}
          </p>
          <Spacer y={1.8} />
          <h1 className="Title">Metrics</h1>
          <Spacer y={1} />
          {(metrics && (
            <>
              <p className={styles.Data}>
                <RefreshIcon />
                Circulating Supply: {metrics.circulatingSupply.toLocaleString()}{" "}
                {props.ticker}
              </p>
              <p className={styles.Data}>
                <DollarIcon />
                Total Supply: {metrics.totalSupply.toLocaleString()}{" "}
                {props.ticker}
              </p>
              <p className={styles.Data}>
                <BankIcon />
                Market Cap: ~${metrics.marketCap.toLocaleString()} USD
              </p>
            </>
          )) || (
            <>
              <Loading.Skeleton
                style={{
                  width: "36%",
                  marginBottom: ".5em",
                  height: "1.35em",
                }}
              />
              <Loading.Skeleton
                style={{
                  width: "36%",
                  marginBottom: ".5em",
                  height: "1.35em",
                }}
              />
              <Loading.Skeleton style={{ width: "36%", height: "1.35em" }} />
            </>
          )}
          <Spacer y={1.8} />
          <h1 className="Title">Links</h1>
          <Spacer y={1} />
          {state?.settings?.communityAppUrl && (
            <a
              href={state.settings.communityAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.Data}
            >
              <LinkIcon />
              {state.settings.communityAppUrl.replace(
                /((http(s?)):\/\/)|(\/$)/g,
                ""
              )}
            </a>
          )}
          {state && (
            <>
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
                href={`https://community.xyz/#${props.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.Data}
              >
                <UsersIcon />
                Community XYZ
              </a>
              <Tooltip
                text={
                  (supportsFCP(state) && "Token supports FCP") ||
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
                  {(supportsFCP(state) && (
                    <>
                      <CheckCircleIcon />
                      Tradable
                    </>
                  )) || (
                    <>
                      <CloseCircleIcon />
                      Not tradable
                    </>
                  )}
                </a>
              </Tooltip>
            </>
          )}
          {state?.settings?.communityDiscussionLinks &&
            state?.settings?.communityDiscussionLinks.map((url, i) => (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                key={i}
                className={styles.Data}
              >
                <MessageIcon />
                {url.replace(/((http(s?)):\/\/)|(\/$)/g, "")}
              </a>
            ))}
          {!state?.settings && (
            <>
              <Loading.Skeleton
                style={{
                  width: "28%",
                  marginBottom: ".5em",
                  height: "1.35em",
                }}
              />
              <Loading.Skeleton
                style={{
                  width: "28%",
                  marginBottom: ".5em",
                  height: "1.35em",
                }}
              />
              <Loading.Skeleton style={{ width: "28%", height: "1.35em" }} />
            </>
          )}
        </div>
        <Card className={styles.ActionCard}>
          <Input
            label="Address"
            placeholder="Recipient..."
            {...target.bindings}
          />
          <Spacer y={1.2} />
          <Input
            label="Amount"
            placeholder="2000"
            type="number"
            {...amount.bindings}
            inlineLabel={props.ticker}
          />
          <Spacer y={2.8} />
          <Button
            onClick={transfer}
            style={{ width: "100%" }}
            loading={transferring}
          >
            Transfer
          </Button>
          <Spacer y={1.3} />
          <Button
            type="outlined"
            style={{ width: "100%" }}
            onClick={() => router.push(`/swap/${props.id}`)}
          >
            Swap
          </Button>
        </Card>
      </div>
    </Page>
  );
};

export interface PropTypes {
  id: string;
  name: string;
  ticker: string;
  price: number | "--";
  type?: TokenType;
}

export default Community;
