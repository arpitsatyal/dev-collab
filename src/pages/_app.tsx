import type { AppProps } from "next/app";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { MantineProvider } from "@mantine/core";
import { SessionProvider } from "next-auth/react";
import { ReactElement, ReactNode } from "react";
import { NextPage } from "next";
import { Notifications } from "@mantine/notifications";
import { LiveblocksProvider } from "@liveblocks/react";
import { MantineEmotionProvider } from "@mantine/emotion";

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
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
        <SessionProvider session={pageProps.session}>
          <MantineProvider>
            <MantineEmotionProvider>
              <Notifications position="top-right" />
              {getLayout(<Component {...pageProps} />)}
            </MantineEmotionProvider>
          </MantineProvider>
        </SessionProvider>
      </LiveblocksProvider>
    </>
  );
}

export default MyApp;
