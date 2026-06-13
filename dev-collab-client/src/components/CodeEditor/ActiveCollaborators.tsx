import { Avatar, Group, Paper, Stack, Text } from "@mantine/core";
import { useOthers } from "@liveblocks/react";

const ActiveCollaborators = () => {
  const others = useOthers();
  return (
    <Paper
      shadow="sm"
      p="md"
      radius="md"
      withBorder
      style={{ flex: "1 1 200px", maxWidth: "300px" }}
    >
      <Text size="sm" fw={500} mb="xs" className="title">
        Active Users
      </Text>
      {others.length ? (
        <Stack gap="xs">
          {others.map(({ id, info }) => (
            <Group key={id} wrap="nowrap" align="center">
              <Avatar src={info.avatar} alt={info.name} radius="xl" size="md" />
              <Text
                size="sm"
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {info.name}
              </Text>
            </Group>
          ))}
        </Stack>
      ) : (
        <Text size="sm" fs="italic" className="secondary">
          No active users
        </Text>
      )}
    </Paper>
  );
};

export default ActiveCollaborators;
