import { Button } from "@verto/ui";
import Link from "next/link";
import logoLight from "../assets/logo_light.svg";
import styles from "../styles/components/Nav.module.sass";

export default function Nav() {
  return (
    <div className={styles.Nav}>
      <Link href="/">
        <a className={styles.Logo}>
          <img src={logoLight} alt="V" />
        </a>
      </Link>
      <Button small>Connect</Button>
    </div>
  );
}
