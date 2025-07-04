import "../global.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/spotlight/styles.css";
import "@mantine/dates/styles.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-tiptap/styles.css";
import "@liveblocks/react-ui/styles/dark/media-query.css";

import type { AppProps } from "next/app";
import { MantineProvider } from "@mantine/core";
import { SessionProvider } from "next-auth/react";
import { ReactElement, ReactNode } from "react";
import { NextPage } from "next";
import { Notifications } from "@mantine/notifications";
import { LiveblocksProvider } from "@liveblocks/react";
import { MantineEmotionProvider } from "@mantine/emotion";
import { Provider } from "react-redux";
import { store } from "../store/store";
import { theme } from "../utils/theme";
import {
  fetchMentionSuggestions,
  resolveUsers,
} from "../utils/liveblocksHelpers";
import { debounce } from "lodash";

/* eslint-disable @typescript-eslint/no-empty-object-type */
export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);

  const debouncedFetchMentionSuggestions = debounce(
    fetchMentionSuggestions,
    300
  );

  return (
    <Provider store={store}>
      <LiveblocksProvider
        authEndpoint="/api/liveblocks-auth"
        resolveUsers={resolveUsers}
        resolveMentionSuggestions={({ text }) =>
          debouncedFetchMentionSuggestions(text) ?? []
        }
      >
        <SessionProvider session={pageProps.session}>
          <MantineProvider
            theme={theme}
            withGlobalClasses
            defaultColorScheme="dark"
          >
            <MantineEmotionProvider>
              <Notifications position="top-right" />
              {getLayout(<Component {...pageProps} />)}
            </MantineEmotionProvider>
          </MantineProvider>
        </SessionProvider>
      </LiveblocksProvider>
    </Provider>
  );
}

export default MyApp;
