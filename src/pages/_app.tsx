import type { AppProps } from "next/app";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { MantineProvider } from "@mantine/core";
import { SessionProvider } from "next-auth/react";
import { ReactElement, ReactNode } from "react";
import { NextPage } from "next";
import { Notifications } from "@mantine/notifications";
import { LiveblocksProvider } from "@liveblocks/react";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <>
      <LiveblocksProvider
        publicApiKey={process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!}
      >
        <SessionProvider session={pageProps.session}>
          <MantineProvider>
            <Notifications position="top-right" />
            {getLayout(<Component {...pageProps} />)}
          </MantineProvider>
        </SessionProvider>
      </LiveblocksProvider>
    </>
  );
}

export default MyApp;
