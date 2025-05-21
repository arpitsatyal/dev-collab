import { Grid, Paper, Text, useMantineTheme } from "@mantine/core";
import { Task, TaskStatus } from "@prisma/client";
import { ConnectDropTarget, useDrop } from "react-dnd";
import TaskItem from "./TaskItem";

interface TaskColumnProps {
  title: string;
  tasks: Task[];
  theme: ReturnType<typeof useMantineTheme>;
  onDropTask: (taskId: string, taskStatus: TaskStatus) => void;
}
const TaskColumn = ({ title, tasks, theme, onDropTask }: TaskColumnProps) => {
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

  return (
    <Grid.Col span={{ base: 12, md: 4 }}>
      <Paper
        ref={dropRef as any} //todo: FIX TYPE ERROR
        p="md"
        shadow="xs"
        style={{ backgroundColor: theme.colors.gray[0] }}
      >
        <Text fw={500} size="lg" mb="md">
          {title}
        </Text>
        {tasks.length === 0 ? (
          <Text c="dimmed" size="sm">
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
