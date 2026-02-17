import { Box, Text } from "@mantine/core";
import { User } from "@prisma/client";
import dayjs from "dayjs";

interface LastSavedInfoProps {
  user: User;
  updatedAt: Date;
}

const LastSavedInfo = ({ user, updatedAt }: LastSavedInfoProps) => {
  return (
    <Box w="100%">
      <Text
        fz={{ base: "sm", md: "xs" }}
        fs="italic"
        c="dimmed"
        maw={{ base: 200, md: "100%" }}
        style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        Last saved: {dayjs(updatedAt).format("MMM D, YYYY [at] h:mm a")}
        {user.name ? ` by ${user.name}` : ""}
      </Text>
    </Box>
  );
};

export default LastSavedInfo;
