import { Grid, Paper, Text } from "@mantine/core";
import { Task, TaskStatus } from "@prisma/client";
import { useDrop } from "react-dnd";
import TaskItem from "./TaskItem";
import classes from "./Task.module.css";

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

  return (
    <Grid.Col span={{ base: 12, md: 4 }}>
      <Paper ref={dropRef as any} p="md" shadow="xs" className={classes.column}>
        <Text fw={500} size="lg" mb="md">
          {title}
        </Text>
        {tasks.length === 0 ? (
          <Text size="sm" className="secondary">
            No work items in this column
          </Text>
        ) : (
          tasks.map((task) => <TaskItem task={task} key={task.id} />)
        )}
      </Paper>
    </Grid.Col>
  );
};

export default TaskColumn;
