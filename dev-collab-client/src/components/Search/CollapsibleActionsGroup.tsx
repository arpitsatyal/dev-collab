import BaseButton from "../shared/base/BaseButton";
import {  Collapse, Group, Text } from "@mantine/core";
import { Spotlight } from "@mantine/spotlight";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { useState } from "react";

const CollapsibleActionsGroup = ({
  label,
  children,
  groupLabel }: {
  label: string;
  children: React.ReactNode;
  groupLabel: string;
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <>
      <BaseButton
        variant="subtle"
        onClick={toggleCollapse}
        radius="sm"
        fullWidth
        styles={(theme) => ({
          root: {
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            borderRadius: theme.radius.sm,
            backgroundColor: "transparent" } })}
      >
        <Group gap={6} align="center" wrap="nowrap">
          <Text fw={500} size="sm">
            {label}
          </Text>
          {isCollapsed ? (
            <IconChevronRight size={14} />
          ) : (
            <IconChevronDown size={14} />
          )}
        </Group>
      </BaseButton>

      <Collapse
        in={!isCollapsed}
        transitionDuration={300}
        transitionTimingFunction="ease"
      >
        <Spotlight.ActionsGroup label={groupLabel}>
          {children}
        </Spotlight.ActionsGroup>
      </Collapse>
    </>
  );
};

export default CollapsibleActionsGroup;
