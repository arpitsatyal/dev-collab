import { Grid, Paper, Text, useMantineColorScheme } from "@mantine/core";
import { Task, TaskStatus } from "@prisma/client";
import { useDrop } from "react-dnd";
import TaskItem from "./TaskItem";

interface TaskColumnProps {
  title: string;
  tasks: Task[];
  onDropTask: (taskId: string, taskStatus: TaskStatus) => void;
}
const TaskColumn = ({ title, tasks, onDropTask }: TaskColumnProps) => {
  const status =
    title === "To Do"
      ? TaskStatus.TODO
      : title === "In Progress"
      ? TaskStatus.IN_PROGRESS
      : TaskStatus.DONE;

  const [_, dropRef] = useDrop({
    accept: "TASK",
    drop: (item: { id: string; status: TaskStatus }) => {
      if (item.status !== status) {
        onDropTask(item.id, status);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const { colorScheme } = useMantineColorScheme();
  const backgroundColor = colorScheme === "dark" ? "dark.6" : "gray.0";
  const titleColor = colorScheme === "dark" ? "gray.0" : "gray.8";
  const noTasksColor = colorScheme === "dark" ? "gray.5" : "dimmed";

  return (
    <Grid.Col span={{ base: 12, md: 4 }}>
      <Paper ref={dropRef as any} p="md" shadow="xs" bg={backgroundColor}>
        <Text fw={500} size="lg" mb="md" c={titleColor}>
          {title}
        </Text>
        {tasks.length === 0 ? (
          <Text c={noTasksColor} size="sm">
            No tasks in this column
          </Text>
        ) : (
          tasks.map((task) => <TaskItem task={task} key={task.id} />)
        )}
      </Paper>
    </Grid.Col>
  );
};

export default TaskColumn;
