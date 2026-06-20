import { Text, Paper, Group, Stack } from "@mantine/core";
import { WorkItem } from "../../types";
import { useDrag } from "react-dnd";
import dayjs from "dayjs";
import classes from "./WorkItem.module.css";
import { useDisclosure } from "@mantine/hooks";
import ImplementationPlanModal from "./ImplementationPlan";
import StatusBadge from "../shared/StatusBadge";
import CollapsibleText from "../shared/CollapsibleText";

const WorkItemItem = ({ workItem }: { workItem: WorkItem }) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [{ isDragging }, dragRef] = useDrag({
    type: "WORK_ITEM",
    item: { id: workItem.id, status: workItem.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <>
      <Paper
        ref={dragRef as any}
        p="sm"
        mb="sm"
        className={classes.item}
        style={{
          opacity: isDragging ? 0.5 : 1,
          cursor: "pointer",
        }}
        onClick={open}
      >
        <Stack gap="xs">
          <Group justify="space-between" align="flex-start">
            <Text fw={500} style={{ flexGrow: 1 }}>
              {workItem.title}
            </Text>
            <StatusBadge status={workItem.status} />
          </Group>

          <CollapsibleText text={workItem.description ?? ""} />

          {workItem.dueDate && (
            <Text size="xs" c="dimmed">
              Due: {dayjs(workItem.dueDate).format("MMM D, YYYY")}
            </Text>
          )}
        </Stack>
      </Paper>

      <ImplementationPlanModal
        opened={opened}
        onClose={close}
        workItemId={workItem.id}
        workItemTitle={workItem.title}
        workspaceId={workItem.workspaceId}
        initialPlan={workItem.aiPlan ? JSON.parse(workItem.aiPlan) : null}
      />
    </>
  );
};

export default WorkItemItem;
