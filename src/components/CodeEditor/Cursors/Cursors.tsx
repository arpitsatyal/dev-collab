import { useEffect, useMemo, useState } from "react";
import { useSelf } from "@liveblocks/react/suspense";
import { AwarenessList, UserAwareness } from "../../../../liveblocks.config";

type Props = {
  yProvider: any; // LiveblocksYjsProvider
};

export function Cursors({ yProvider }: Props) {
  const userInfo = useSelf((me) => me.info);
  const [awarenessUsers, setAwarenessUsers] = useState<AwarenessList>([]);

  useEffect(() => {
    // Set local user info in awareness
    yProvider.awareness.setLocalStateField("user", userInfo);

    const updateAwareness = () => {
      const allStates = [...yProvider.awareness.getStates()] as AwarenessList;

      // Deduplicate users by `user.id`, fallback to `clientId` if missing
      const seen = new Map<string, [number, UserAwareness]>();

      for (const [clientId, client] of allStates) {
        const key = `client-${clientId}`;
        if (!seen.has(key)) {
          seen.set(key, [clientId, client]);
        }
      }

      setAwarenessUsers([...seen.values()]);
    };

    yProvider.awareness.on("change", updateAwareness);
    updateAwareness();

    const cleanup = () => {
      yProvider.awareness.setLocalState(null); // clears local state
    };

    window.addEventListener("beforeunload", cleanup);

    return () => {
      yProvider.awareness.off("change", updateAwareness);
      window.removeEventListener("beforeunload", cleanup);
      cleanup();
    };
  }, [yProvider, userInfo]);

  const styleSheet = useMemo(() => {
    let cursorStyles = "";

    for (const [clientId, client] of awarenessUsers) {
      if (client?.user) {
        cursorStyles += `
          .yRemoteSelection-${clientId}, 
          .yRemoteSelectionHead-${clientId} {
            --user-color: ${client.user.color || "#0074C2"};
          }

          .yRemoteSelectionHead-${clientId}::after {
            content: "${client.user.name}";
          }
        `;
      }
    }

    return { __html: cursorStyles };
  }, [awarenessUsers]);

  return <style dangerouslySetInnerHTML={styleSheet} />;
}
