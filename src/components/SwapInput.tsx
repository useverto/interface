import { AnimatePresence, motion } from "framer-motion";
import { opacityAnimation } from "../utils/animations";
import {
  useState,
  useEffect,
  CSSProperties,
  PropsWithChildren,
  ChangeEventHandler,
} from "react";
import styles from "../styles/components/SwapInput.module.sass";

export default function SwapInput({
  children,
  value = "",
  onChange,
  className,
  style,
  disabled = false,
  status,
  matchPattern,
  extraPadding = false,
  ...props
}: PropsWithChildren<Props>) {
  const [val, setVal] = useState(value);
  const [inputStatus, setInputStatus] = useState(status);
  const [changed, setChanged] = useState(false);

  useEffect(() => setVal(value), [value]);
  useEffect(() => setInputStatus(status), [status]);

  useEffect(() => {
    if (typeof val !== "string" || !matchPattern || !changed) return;
    if (!val.match(matchPattern)) setInputStatus("error");
    else setInputStatus(undefined);
  }, [val]);

  return (
    <div
      className={
        styles.SwapInput + " " + (!extraPadding && styles.NormalPadding) ||
        "" + " " + (inputStatus && styles[`Status_${inputStatus}`]) ||
        "" + (disabled && styles.Disabled) ||
        "" + " " + (className || "")
      }
      style={style}
      {...props}
    >
      {(val === "" || extraPadding) && (
        <div className={styles.Placeholder}>{children}</div>
      )}
      <input
        type={typeof value === "number" ? "number" : "text"}
        onChange={(e) => {
          setVal(
            typeof value === "number" ? Number(e.target.value) : e.target.value
          );
          setChanged(true);
          if (onChange) onChange(e);
        }}
        value={val}
        disabled={disabled}
      />
    </div>
  );
}

interface Props {
  value: string | number;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  status?: InputStatus;
  matchPattern?: RegExp;
  extraPadding?: boolean;
}

type InputStatus = undefined | "error" | "warning" | "success";
