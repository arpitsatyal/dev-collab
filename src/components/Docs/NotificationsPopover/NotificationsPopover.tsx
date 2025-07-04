import {
  useInboxNotifications,
  useMarkAllInboxNotificationsAsRead,
  useUnreadInboxNotificationsCount,
} from "@liveblocks/react/suspense";
import { InboxNotification, InboxNotificationList } from "@liveblocks/react-ui";
import { Suspense } from "react";
import styles from "./NotificationsPopover.module.css";
import Loading from "../../Loader/Loader";
import { Box, Popover } from "@mantine/core";
import { IconInbox } from "@tabler/icons-react";
import { useMediaQuery } from "@mantine/hooks";

export default function NotificationsPopover() {
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  return (
    <Popover width={isSmallScreen ? 300 : 600}>
      <Popover.Target>
        <Box>
          <IconInbox style={{ cursor: "pointer" }} />
          <Suspense fallback={null}>
            <UnreadNotificationsCount />
          </Suspense>
        </Box>
      </Popover.Target>

      <Popover.Dropdown>
        <Suspense fallback={<Loading />}>
          <Inbox />
        </Suspense>
      </Popover.Dropdown>
    </Popover>
  );
}

function UnreadNotificationsCount() {
  const { count } = useUnreadInboxNotificationsCount();

  if (count <= 0) return null;

  return <span className={styles.unreadCount}>{count}</span>;
}

function Inbox() {
  const { inboxNotifications } = useInboxNotifications();
  const markAllNotificationsAsRead = useMarkAllInboxNotificationsAsRead();

  return (
    <>
      <div className={styles.inboxHeader}>
        <button
          className={styles.markAllButton}
          disabled={inboxNotifications.length === 0}
          onClick={markAllNotificationsAsRead}
        >
          Mark all as read
        </button>
      </div>

      <div className={styles.inboxList}>
        {inboxNotifications.length === 0 ? (
          <div className={styles.emptyState}>No notifications yet</div>
        ) : (
          <InboxNotificationList>
            {inboxNotifications.map((inboxNotification) => (
              <InboxNotification
                key={inboxNotification.id}
                inboxNotification={inboxNotification}
                showActions={false}
              />
            ))}
          </InboxNotificationList>
        )}
      </div>
    </>
  );
}
