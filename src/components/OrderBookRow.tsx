import styles from "../styles/components/OrderBookRow.module.sass";

const OrderBookRow = ({ id, type, price, amount, total }: Props) => (
  <tr className={styles.OrberBookRow + " " + styles[`Theme_${type}`]}>
    <td className={styles.OrderType}>
      {type} {id}
    </td>
    <td>{price}</td>
    <td>{amount}</td>
    <td className={styles.Total}>{total}</td>
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

export default OrderBookRow;

interface Props {
  id: number;
  type: "buy" | "sell";
  price: number;
  amount: number;
  total: number;
}
