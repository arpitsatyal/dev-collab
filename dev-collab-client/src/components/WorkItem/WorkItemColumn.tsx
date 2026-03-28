import { Grid, Paper, Text } from "@mantine/core";
import { WorkItem, WorkItemStatus } from "../../types";
import { useDrop } from "react-dnd";
import WorkItemItem from "./WorkItemItem";
import classes from "./WorkItem.module.css";

interface WorkItemColumnProps {
  title: string;
  workItems: WorkItem[];
  onDropWorkItem: (workItemId: string, workItemStatus: WorkItemStatus) => void;
}
const WorkItemColumn = ({ title, workItems, onDropWorkItem }: WorkItemColumnProps) => {
  const status =
    title === "To Do"
      ? WorkItemStatus.TODO
      : title === "In Progress"
        ? WorkItemStatus.IN_PROGRESS
        : WorkItemStatus.DONE;

  const [_, dropRef] = useDrop({
    accept: "WORK_ITEM",
    drop: (item: { id: string; status: WorkItemStatus }) => {
      if (item.status !== status) {
        onDropWorkItem(item.id, status);
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
        {workItems.length === 0 ? (
          <Text size="sm" className="secondary">
            No work items in this column
          </Text>
        ) : (
          workItems.map((workItem) => <WorkItemItem workItem={workItem} key={workItem.id} />)
        )}
      </Paper>
    </Grid.Col>
  );
};

export default WorkItemColumn;
