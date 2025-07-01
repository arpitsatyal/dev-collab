import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import DocsSideNav from "./DocsSideNav";
import styles from "./Docs.module.css";
import { Burger } from "@mantine/core";
import Layout from "../Layout/Layout";

interface DocsLayoutProps {
  children: React.ReactNode;
}

const DocsLayout = ({ children }: DocsLayoutProps) => {
  const [opened, { toggle }] = useDisclosure(false);
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  return (
    <Layout>
      <div className={styles.container}>
        <header>
          <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" />
        </header>
        <nav
          className={`${styles.sidebar} ${
            opened || !isSmallScreen ? styles.open : ""
          }`}
        >
          <DocsSideNav />
        </nav>
        <main
          className={`${styles.main} ${
            isSmallScreen && opened ? styles.hidden : ""
          }`}
        >
          {children}
        </main>
      </div>
    </Layout>
  );
};

export default DocsLayout;
