import { Text, Paper } from "@mantine/core";
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

  return (
    <Paper
      ref={dragRef as any} //todo: FIX TYPE ERROR
      p="sm"
      mb="sm"
      style={{
        backgroundColor: "#ffffff",
        opacity: isDragging ? 0.5 : 1,
        cursor: "move",
      }}
    >
      <Text>{task.title}</Text>
      {task.description && <Text size="sm">{task.description}</Text>}
      {task.dueDate && (
        <Text size="xs">Due: {dayjs(task.dueDate).format("MMM D, YYYY")}</Text>
      )}
    </Paper>
  );
};

export default TaskItem;
