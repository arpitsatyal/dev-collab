import { ReactNode } from "react";
import Layout from "../Layout/Layout";
import DocsSideNav from "./DocsSideNav";
import styles from "./Docs.module.css";

interface DocsLayoutProps {
  children: ReactNode;
}

const DocsLayout = ({ children }: DocsLayoutProps) => {
  return (
    <Layout>
      <div className={styles.container}>
        <nav className={styles.sidebar}>
          <DocsSideNav />
        </nav>
        <main className={styles.main}>{children}</main>
      </div>
    </Layout>
  );
};

export default DocsLayout;
