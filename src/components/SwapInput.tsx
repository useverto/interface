import { AnimatePresence, motion } from "framer-motion";
import { opacityAnimation } from "../utils/animations";
import {
  useState,
  useEffect,
  CSSProperties,
  PropsWithChildren,
  ChangeEventHandler,
  useRef,
} from "react";
import styles from "../styles/components/SwapInput.module.sass";

export default function SwapInput({
  children,
  value = "",
  onChange,
  className,
  style,
  disabled = false,
  readonly = false,
  status,
  matchPattern,
  extraPadding = false,
  focusTheme = false,
  ...props
}: PropsWithChildren<SwapInputProps>) {
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

  const inputElement = useRef<HTMLInputElement>();

  return (
    <div
      className={
        styles.SwapInput +
        " " +
        ((!extraPadding && styles.NormalPadding) || "") +
        " " +
        ((inputStatus && styles[`Status_${inputStatus}`]) || "") +
        " " +
        ((disabled && styles.Disabled) || "") +
        " " +
        ((readonly && styles.ReadOnly) || "") +
        " " +
        ((focusTheme && styles.Focus) || "") +
        " " +
        (className || "")
      }
      style={style}
      {...props}
    >
      {(val === "" || extraPadding) && (
        // we cannot just set the z-index to -1, because sometimes
        // the children need to be clickable
        <div
          className={styles.Placeholder}
          onClick={() => inputElement.current.focus()}
        >
          {children}
        </div>
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
        readOnly={readonly}
        style={
          (extraPadding &&
            typeof extraPadding !== "boolean" && {
              paddingLeft: extraPadding.left,
              paddingRight: extraPadding.right,
              width: `calc(100% - ${extraPadding.left} - ${extraPadding.right})`,
            }) ||
          undefined
        }
        ref={inputElement}
      />
    </div>
  );
}

export interface SwapInputProps {
  value: string | number;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  status?: InputStatus;
  matchPattern?: RegExp;
  extraPadding?:
    | boolean
    | {
        left: string;
        right: string;
      };
  readonly?: boolean;
  focusTheme?: boolean;
}

type InputStatus = undefined | "error" | "warning" | "success";
