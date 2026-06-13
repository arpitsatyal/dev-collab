import React, { JSX } from "react";
import { Spotlight } from "@mantine/spotlight";
import { Group, Box, Text } from "@mantine/core";
import { IconFolder } from "@tabler/icons-react";
import { truncateByWords } from "../../utils/common/truncate";
import classes from "./SpotlightSearch.module.css";

export interface DataItem {
  id: string;
  title: string;
  icon: JSX.Element;
  onClick: () => void;
  groupLabel: string;
  description?: string;
  meta?: Record<string, any>;
}

interface ActionItemProps {
  item: DataItem;
}

const ActionItem = ({ item }: ActionItemProps) => (
  <Spotlight.Action className={classes.noActive}>
    <Group wrap="nowrap" w="100%">
      {item.icon}
      <Box style={{ flex: 1 }} p={3} onClick={item.onClick}>
        <Text>{item.title}</Text>
        {item.meta?.workspaceTitle ? (
          <Group gap="xs">
            <IconFolder size={16} />
            <Text size="xs" opacity={0.6}>
              {item.meta.workspaceTitle}
            </Text>
          </Group>
        ) : (
          item.description && (
            <Text opacity={0.6} size="xs">
              {truncateByWords(item.description, 30)}
            </Text>
          )
        )}
      </Box>
    </Group>
  </Spotlight.Action>
);

export default ActionItem;
