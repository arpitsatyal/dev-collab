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

export default function NotificationsPopover() {
  return (
    <Popover width={300} position="bottom-end" withArrow shadow="md">
      <Popover.Target>
        <Box
          style={{
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            padding: "8px",
            borderRadius: "4px",
          }}
        >
          <svg
            width="20"
            height="20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="m3.6 9.8 1.9-4.6A2 2 0 0 1 7.3 4h5.4a2 2 0 0 1 1.8 1.2l2 4.6V13a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V9.8Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M3.5 10h3c.3 0 .6.1.8.4l.9 1.2c.2.3.5.4.8.4h2c.3 0 .6-.1.8-.4l.9-1.2c.2-.3.5-.4.8-.4h3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <Suspense fallback={null}>
            <UnreadNotificationsCount />
          </Suspense>
        </Box>
      </Popover.Target>

      <Popover.Dropdown
        style={{
          padding: "16px",
          borderRadius: "8px",
        }}
      >
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
              />
            ))}
          </InboxNotificationList>
        )}
      </div>
    </>
  );
}
