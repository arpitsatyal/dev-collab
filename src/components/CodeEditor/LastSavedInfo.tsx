import { Avatar, Box, Flex, Text, Tooltip } from "@mantine/core";
import { User } from "@prisma/client";
import dayjs from "dayjs";

interface LastSavedInfoProps {
  user: User;
  updatedAt: Date;
}

const LastSavedInfo = ({ user, updatedAt }: LastSavedInfoProps) => {
  return (
    <Box
      w="100%"
      maw={{ md: 200 }}
      mt={{ base: "sm", md: 0 }}
      style={{ textAlign: "right" }}
    >
      <Flex
        direction="column"
        align={{ base: "flex-start", md: "flex-end" }}
        gap="xs"
      >
        <Tooltip label={user.name ?? "Unknown User"} withinPortal>
          <Avatar
            src={user.image}
            alt={user.name ?? "User avatar"}
            radius="xl"
            size="md"
          />
        </Tooltip>

        <Text
          fs="italic"
          fz="xs"
          maw={{ base: "100%", md: 200 }}
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Last Saved: {dayjs(updatedAt).format("MMM D, YYYY [at] h:mm a")}
        </Text>
      </Flex>
    </Box>
  );
};

export default LastSavedInfo;
