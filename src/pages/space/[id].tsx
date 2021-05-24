import { Loading, Page, Spacer, useInput, useTheme } from "@verto/ui";
import { PriceInterface } from "@verto/js/dist/faces";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { GraphDataConfig, GraphOptions } from "../../utils/graph";
import Verto from "@verto/js";
import axios from "axios";
import Head from "next/head";
import Metas from "../../components/Metas";
import dayjs from "dayjs";
import styles from "../../styles/views/token.module.sass";

const client = new Verto();

interface PropTypes extends PriceInterface {
  id: string;
}

const Token = (props: PropTypes) => {
  // TODO: custom layout
  const type = props.type || "community";

  return (
    <Page>
      {(type === "community" && <Community {...props} />) || <Art {...props} />}
    </Page>
  );
};

const Community = (props: PropTypes) => {
  const periods = ["24h", "1w", "1m", "1y", "ALL"];
  const [selectedPeriod, setSelectedPeriod] = useState<string>("ALL");
  const [state, setState] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    axios
      .get(`https://v2.cache.verto.exchange/${props.id}`)
      .then(({ data }) => {
        let state = data.state;
        if (state.settings)
          state.settings = Object.fromEntries(new Map(state.settings));

        setState(state);
      });
  }, []);

  const [history, setHistory] = useState<
    {
      date: string;
      price: number;
    }[]
  >();

  useEffect(() => {
    (async () => {
      const priceHistory = await client.getPriceHistory(props.id);
      const filterDates = (date) => {
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
      setHistory(prices);
    })();
  }, [selectedPeriod]);

  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (state) {
      const circulatingSupply = Object.values(state.balances).reduce(
        (a: number, b: number) => a + b,
        0
      ) as number;

      let totalSupply: number = circulatingSupply;
      if (state.vault)
        for (const vault of Object.values(state.vault) as any) {
          totalSupply += vault
            .map((a: any) => a.balance)
            .reduce((a: number, b: number) => a + b, 0);
        }

      const marketCap = (totalSupply * props.price).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      setMetrics({
        marketCap,
        circulatingSupply: circulatingSupply.toLocaleString(),
        totalSupply: totalSupply.toLocaleString(),
      });
    }
  }, [state]);

  const amount = useInput();
  const target = useInput();

  const transfer = async () => {
    const id = await client.transfer(
      amount.state as number,
      props.id,
      target.state as string
    );
    console.log(id);
  };

  return (
    <>
      <Head>
        <title>Verto - {props.name}</title>
        {/** TODO: get image of community and put it in the metas OG */}
        <Metas title={props.name} />
      </Head>
      <Spacer y={3} />
      <div className={styles.TokenDetails}>
        <h1 className={styles.Name}>
          {props.name} <span>({props.ticker})</span>
        </h1>
        <h1 className={styles.Price}>
          $
          {props.price.toLocaleString(undefined, {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
          })}
        </h1>
        <Spacer y={3.75} />
        <div className={styles.PeriodMenu}>
          {periods.map((per, i) => (
            <span
              key={i}
              className={selectedPeriod === per ? styles.Selected : ""}
              onClick={() => setSelectedPeriod(per)}
            >
              {per}
            </span>
          ))}
        </div>
        <Spacer y={1.5} />
        <div className={styles.Graph}>
          {history && (
            <Line
              data={{
                labels: history.map(({ date }) => date),
                datasets: [
                  {
                    data: history.map(({ price }) => price),
                    ...GraphDataConfig,
                    borderColor: theme === "Light" ? "#000000" : "#ffffff",
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
          )}
        </div>
        <Spacer y={3.75} />
        <h1 className="Title">About</h1>
        <Spacer y={1} />
        <p className={styles.Paragraph}>
          {state?.settings?.communityDescription || (
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
              <Loading.Skeleton style={{ width: "85%", height: "1.35em" }} />
            </>
          )}
        </p>
        <Spacer y={1.8} />
        <h1 className="Title">Metrics</h1>
        <Spacer y={1} />
        <p className={styles.Paragraph}>
          {(metrics && (
            <>
              Market Cap: ~${metrics.marketCap.toLocaleString()} USD
              <br />
              Circulating Supply: {metrics.circulatingSupply.toLocaleString()}{" "}
              {props.ticker}
              <br />
              Total Supply: {metrics.totalSupply.toLocaleString()}{" "}
              {props.ticker}
            </>
          )) || (
            <>
              <Loading.Skeleton
                style={{ width: "36%", marginBottom: ".5em", height: "1.35em" }}
              />
              <Loading.Skeleton
                style={{ width: "36%", marginBottom: ".5em", height: "1.35em" }}
              />
              <Loading.Skeleton style={{ width: "36%", height: "1.35em" }} />
            </>
          )}
        </p>
        <Spacer y={1.8} />
        <h1 className="Title">Links</h1>
        <Spacer y={1} />
        <p className={styles.Paragraph}>
          <ul>
            {state?.settings?.communityAppUrl && (
              <li>
                <a
                  href={state.settings.communityAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {state.settings.communityAppUrl.replace(
                    /(http(s?)):\/\//,
                    ""
                  )}
                </a>
              </li>
            )}
            {state && (
              <li>
                <a
                  href={`https://community.xyz/#${props.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  community.xyz/{props.name.toLowerCase()}
                </a>
              </li>
            )}
            {state?.settings?.communityDiscussionLinks &&
              state?.settings?.communityDiscussionLinks.map((url, i) => (
                <li key={i}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {url.replace(/(http(s?)):\/\//, "")}
                  </a>
                </li>
              ))}
          </ul>
          {!state?.settings && (
            <>
              <Loading.Skeleton
                style={{ width: "28%", marginBottom: ".5em", height: "1.35em" }}
              />
              <Loading.Skeleton
                style={{ width: "28%", marginBottom: ".5em", height: "1.35em" }}
              />
              <Loading.Skeleton style={{ width: "28%", height: "1.35em" }} />
            </>
          )}
        </p>
      </div>
    </>
  );
};

const Art = (props: PropTypes) => {
  return (
    <>
      <Head>
        <title>Verto - {props.name}</title>
        <Metas title={props.name} image={`https://arweave.net/${props.id}`} />
      </Head>
      <img src={`https://arweave.net/${props.id}`} />
    </>
  );
};

export async function getServerSideProps(context) {
  const { id } = context.query;
  const res = await client.getPrice(id);

  const { data: gecko } = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd"
  );

  return { props: { id, ...res, price: res.price * gecko.arweave.usd } };
}

export default Token;
