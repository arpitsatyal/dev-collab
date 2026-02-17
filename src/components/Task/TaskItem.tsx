import { Text, Paper } from "@mantine/core";
import { Task } from "@prisma/client";
import { useDrag } from "react-dnd";
import dayjs from "dayjs";
import classes from "./Task.module.css";
import { useDisclosure } from "@mantine/hooks";
import ImplementationPlanModal from "./ImplementationPlanModal";

const TaskItem = ({ task }: { task: Task }) => {
  const [opened, { open, close }] = useDisclosure(false);
  const [expanded, { toggle: toggleExpanded }] = useDisclosure(false);
  const [{ isDragging }, dragRef] = useDrag({
    type: "TASK",
    item: { id: task.id, status: task.status },
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
        <Text fw={500}>{task.title}</Text>
        {task.description && (
          <div onClick={(e) => e.stopPropagation()}>
            <Text
              size="sm"
              c="dimmed"
              lineClamp={expanded ? undefined : 2}
              style={{ transition: 'all 0.2s ease' }}
            >
              {task.description}
            </Text>
            {task.description.length > 80 && (
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
        {task.dueDate && (
          <Text size="xs" mt="xs">
            Due: {dayjs(task.dueDate).format("MMM D, YYYY")}
          </Text>
        )}
      </Paper>

      <ImplementationPlanModal
        opened={opened}
        onClose={close}
        taskId={task.id}
        taskTitle={task.title}
      />
    </>
  );
};

export default TaskItem;
