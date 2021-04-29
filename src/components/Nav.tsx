import { Avatar, Button } from "@verto/ui";
import { motion } from "framer-motion";
import { permissions, useAddress } from "../utils/arconnect";
import { useRouter } from "next/router";
import useArConnect from "use-arconnect";
import Link from "next/link";
import logoLight from "../assets/logo_light.svg";
import styles from "../styles/components/Nav.module.sass";

export default function Nav() {
  const { address, updateAddress } = useAddress();
  const arconnect = useArConnect();
  const router = useRouter();

  async function login() {
    await window.arweaveWallet.connect(permissions);
    await updateAddress();
  }

  return (
    <motion.div
      className={styles.Nav}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.44, ease: "easeInOut" }}
    >
      <Link href="/">
        <a className={styles.Logo}>
          <img src={logoLight} alt="V" draggable={false} />
        </a>
      </Link>
      {(arconnect && address && (
        <Avatar
          size="small"
          usertag="testusertag"
          name="John"
          avatar="https://th8ta.org/john.jpeg"
          left
          notification={true}
          style={{ cursor: "pointer" }}
        />
      )) ||
        (arconnect && (
          <Button small onClick={login}>
            Connect
          </Button>
        )) || (
          <Button small onClick={() => window.open("https://arconnect.io")}>
            Install ArConnect
          </Button>
        )}
    </motion.div>
  );
}
