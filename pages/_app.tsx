import type { AppProps } from "next/app";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { SessionProvider } from "next-auth/react";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <SessionProvider session={pageProps.session}>
        <MantineProvider>
          <Component {...pageProps} />
        </MantineProvider>
      </SessionProvider>
    </>
  );
}

export default MyApp;
