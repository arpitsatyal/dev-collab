import type { AppProps } from "next/app";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/spotlight/styles.css";
import "@mantine/dates/styles.css";
import { MantineProvider } from "@mantine/core";
import { SessionProvider } from "next-auth/react";
import { ReactElement, ReactNode } from "react";
import { NextPage } from "next";
import { Notifications } from "@mantine/notifications";
import { LiveblocksProvider } from "@liveblocks/react";
import { MantineEmotionProvider } from "@mantine/emotion";
import { Provider } from "react-redux";
import { store } from "../store/store";
import "../global.css";
import { theme } from "../utils/theme";

/* eslint-disable @typescript-eslint/no-empty-object-type */
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
      <Provider store={store}>
        <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
          <SessionProvider session={pageProps.session}>
            <MantineProvider theme={theme} withGlobalClasses>
              <MantineEmotionProvider>
                <Notifications position="top-right" />
                {getLayout(<Component {...pageProps} />)}
              </MantineEmotionProvider>
            </MantineProvider>
          </SessionProvider>
        </LiveblocksProvider>
      </Provider>
    </>
  );
}

export default MyApp;
