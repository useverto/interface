import {
  useState,
  useEffect,
  CSSProperties,
  PropsWithChildren,
  ChangeEventHandler,
  ReactNode,
  useRef,
} from "react";
import styles from "../styles/components/SwapInput.module.sass";

export default function SwapInput({
  value = "",
  children,
  rightEl,
  onChange,
  className,
  style,
  disabled = false,
  readonly = false,
  status,
  matchPattern,
  focusTheme = false,
  type = "text",
  placeholder,
  min,
  max,
  ...props
}: PropsWithChildren<Props>) {
  const [val, setVal] = useState(value);
  const [inputStatus, setInputStatus] = useState(status);
  const [changed, setChanged] = useState(false);

  useEffect(() => setVal(value), [value]);
  useEffect(() => setInputStatus(status), [status]);

  // ensure match pattern is right
  useEffect(() => {
    if (typeof val !== "string" || !matchPattern || !changed) return;
    if (!val.match(matchPattern)) setInputStatus("error");
    else setInputStatus(undefined);
  }, [val]);

  const inputRef = useRef<HTMLInputElement>();

  // adjust input width
  const [inputWidth, setInputWidth] = useState(0);
  const parentRef = useRef<HTMLDivElement>();

  useEffect(calculateInputWidth, [children, rightEl, inputRef]);
  useEffect(() => {
    window.addEventListener("resize", calculateInputWidth);

    return () => window.removeEventListener("resize", calculateInputWidth);
  }, []);

  /**
   * Calculate input width to fit into the parent
   */
  function calculateInputWidth() {
    if (!parentRef) return;
    let labelWidth = 0;

    const numFromCss = (str: string) =>
      parseFloat(str.replace(/(em|px|rem)/g, ""));
    const parentStyle = getComputedStyle(parentRef.current);
    const inputStyle = getComputedStyle(inputRef.current);
    const inputPadding =
      numFromCss(inputStyle.paddingLeft) + numFromCss(inputStyle.paddingRight);

    for (let i = 0; i < parentRef.current.childNodes.length; i++) {
      const child = parentRef.current.childNodes[i] as Element;

      if (child.tagName === "INPUT") continue;
      const computedStyle = getComputedStyle(child as Element);

      labelWidth += numFromCss(computedStyle.width);
    }

    const finalInputWidth =
      numFromCss(parentStyle.width) - labelWidth - inputPadding;

    if (finalInputWidth > 0 && finalInputWidth !== inputWidth)
      setInputWidth(finalInputWidth);
  }

  // validate min-max
  useEffect(() => {
    if (!!max && val > max) setVal(max);
    if (min !== undefined && val < min) setVal(min);
  }, [val, min, max]);

  return (
    <div
      className={
        styles.SwapInput +
        " " +
        ((inputStatus && styles[`Status_${inputStatus}`]) || "") +
        " " +
        ((disabled && styles.Disabled) || "") +
        " " +
        ((readonly && styles.ReadOnly) || "") +
        " " +
        ((focusTheme && styles.Focus) || "") +
        " " +
        ((!children && styles.NoLabel) || "") +
        " " +
        (className || "")
      }
      style={style}
      onClick={(e) => {
        // @ts-expect-error
        if (e.target.tagName === "INPUT" || !inputRef.current) return;
        inputRef.current.focus();
      }}
      {...props}
      ref={parentRef}
    >
      {children && children}
      <input
        type={type}
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
        ref={inputRef}
        style={{
          width: inputWidth,
        }}
        placeholder={placeholder}
        min={min}
        max={max}
      />
      {rightEl && rightEl}
    </div>
  );
}

interface Props {
  rightEl?: ReactNode;
  value: string | number;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  status?: InputStatus;
  matchPattern?: RegExp;
  readonly?: boolean;
  focusTheme?: boolean;
  type?: "text" | "number" | "password";
  placeholder?: string;
  min?: number;
  max?: number;
}

type InputStatus = undefined | "error" | "warning" | "success";
