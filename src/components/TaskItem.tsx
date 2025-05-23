import { Text, Paper, useMantineColorScheme } from "@mantine/core";
import { Task } from "@prisma/client";
import { useDrag } from "react-dnd";
import dayjs from "dayjs";

const TaskItem = ({ task }: { task: Task }) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: "TASK",
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const { colorScheme } = useMantineColorScheme();

  const backgroundColor = colorScheme === "dark" ? "dark.5" : "white";
  const textColor = colorScheme === "dark" ? "gray.0" : "gray.8";
  const secondaryTextColor = colorScheme === "dark" ? "gray.2" : "gray.7";

  return (
    <Paper
      ref={dragRef as any}
      p="sm"
      mb="sm"
      bg={backgroundColor}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: "move",
      }}
    >
      <Text c={textColor}>{task.title}</Text>
      {task.description && (
        <Text size="sm" c={secondaryTextColor}>
          {task.description}
        </Text>
      )}
      {task.dueDate && (
        <Text size="xs" c={secondaryTextColor}>
          Due: {dayjs(task.dueDate).format("MMM D, YYYY")}
        </Text>
      )}
    </Paper>
  );
};

export default TaskItem;
