import { Button, CopyButton, Tooltip } from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const ShareButton = () => {
  const router = useRouter();
  const { roomId } = router.query;
  const [link, setLink] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && typeof roomId === "string") {
      setLink(`${window.location.origin}/playground?roomId=${roomId}`);
    }
  }, [roomId]);

  return (
    <CopyButton value={link} timeout={2000}>
      {({ copied, copy }) => (
        <Tooltip
          label={copied ? "Link copied!" : "Copy share link"}
          position="bottom"
          withArrow
          offset={8}
        >
          <Button
            onClick={copy}
            variant="light"
            color={copied ? "teal" : "blue"}
            size="sm"
            radius="xl"
            leftSection={
              copied ? <IconCheck size={16} /> : <IconCopy size={16} />
            }
            style={{ margin: "1rem" }}
          >
            {copied ? "Room Link Copied" : "Share Room"}
          </Button>
        </Tooltip>
      )}
    </CopyButton>
  );
};

export default ShareButton;
