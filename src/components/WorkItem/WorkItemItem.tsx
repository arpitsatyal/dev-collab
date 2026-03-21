import { Text, Paper } from "@mantine/core";
import { WorkItem } from "../../types";
import { useDrag } from "react-dnd";
import dayjs from "dayjs";
import classes from "./WorkItem.module.css";
import { useDisclosure } from "@mantine/hooks";
import ImplementationPlanModal from "./ImplementationPlan";

const WorkItemItem = ({ workItem }: { workItem: WorkItem }) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [expanded, { toggle: toggleExpanded }] = useDisclosure(false);
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
        <Text fw={500}>{workItem.title}</Text>
        {workItem.description && (
          <div onClick={(e) => e.stopPropagation()}>
            <Text
              size="sm"
              c="dimmed"
              lineClamp={expanded ? undefined : 2}
              style={{ transition: 'all 0.2s ease' }}
            >
              {workItem.description}
            </Text>
            {workItem.description.length > 80 && (
              <Text
                size="xs"
                c="blue"
                span
                style={{ cursor: 'pointer', fontWeight: 500 }}
                onClick={toggleExpanded}
              >
                {expanded ? "See less" : "See more"}
              </Text>
            )}
          </div>
        )}
        {workItem.dueDate && (
          <Text size="xs" mt="xs">
            Due: {dayjs(workItem.dueDate).format("MMM D, YYYY")}
          </Text>
        )}
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
