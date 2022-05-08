import { CloseIcon } from "@iconicicons/react";
import { Loading, Tooltip, useToasts } from "@verto/ui";
import { useEffect, useState } from "react";
import { verto } from "../utils/arweave";
import styles from "../styles/components/OrderBookRow.module.sass";

const OrderBookRow = ({
  index,
  orderID,
  type,
  price,
  amount,
  total,
  cancellable = false,
}: Props) => {
  // get if there is a pending cancel interaction
  // if there isn't and the order is cancellable
  // that means that there were no successful cancel
  // interactions and we can show the cancel button
  const [cancelPending, setCancelPending] = useState(false);

  useEffect(() => {
    (async () => {
      if (!cancellable) return;
      // TODO: check for cancel interactions
    })();
  }, [cancellable]);

  const { setToast } = useToasts();
  const [loadingCancel, setLoadingCancel] = useState(false);

  // cancel the order
  async function cancel() {
    if (!cancellable || cancelPending) return;

    setLoadingCancel(true);

    try {
      await verto.exchange.cancel(orderID);

      setCancelPending(true);
      setToast({
        type: "success",
        description: "Order cancelled",
        duration: 3000,
      });
      setToast({
        type: "info",
        description: "It will be removed from the order book shortly",
        duration: 3000,
      });
    } catch (e) {
      console.error(
        "Error cancelling order: \n",
        "Message: ",
        e,
        "\n",
        "Order data: \n",
        {
          orderID,
          type,
        }
      );
      setToast({
        type: "error",
        description: "Unable to cancel order",
        duration: 3300,
      });
    }

    setLoadingCancel(false);
  }

  return (
    <tr className={styles.OrberBookRow + " " + styles[`Theme_${type}`]}>
      <td className={styles.OrderType}>
        {type} {index}
      </td>
      <td>{price}</td>
      <td>{amount}</td>
      <td className={styles.Total}>{total}</td>
      <td className={styles.CancelColumn}>
        {cancellable && !cancelPending && !loadingCancel && (
          <Tooltip text="Cancel order">
            <CloseIcon
              className={styles.Cancel}
              role="button"
              onClick={cancel}
            />
          </Tooltip>
        )}
        {loadingCancel && <Loading.Spinner className={styles.LoadingCancel} />}
      </td>
      <div
        className={styles.Fill}
        style={{
          width: `${(amount / total) * 100}%`,
          borderTopLeftRadius: amount >= total ? 0 : undefined,
          borderBottomLeftRadius: amount >= total ? 0 : undefined,
        }}
      />
    </tr>
  );
};

export default OrderBookRow;

interface Props {
  index: number;
  orderID: string;
  type: "buy" | "sell";
  price: number;
  amount: number;
  total: number;
  cancellable?: boolean;
}
