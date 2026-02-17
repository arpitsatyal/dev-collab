import {
  Box,
  Button,
  Group,
  Paper,
  Stack,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import classes from "./Project.module.css";
import { UseFormReturnType } from "@mantine/form";
import { ProjectCreateData } from "../../pages/api/projects";

interface CreateProjectFormProps {
  form: UseFormReturnType<
    ProjectCreateData,
    (values: ProjectCreateData) => ProjectCreateData
  >;
  isLoading: boolean;
  handleSubmit: () => void;
}

const CreateProjectForm = ({
  form,
  handleSubmit,
  isLoading,
}: CreateProjectFormProps) => {
  return (
    <Box
      maw={{ base: "100%", sm: 600, md: 800 }}
      mx="auto"
      p={{ base: "sm", sm: "md" }}
    >
      <Paper
        shadow="md"
        p={{ base: "md", sm: "lg" }}
        radius="md"
        withBorder
        className={classes.root}
      >
        <Stack gap="md">
          <Title order={4}>Create New Workspace</Title>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="sm">
              <TextInput
                label="Title"
                placeholder="Enter a title"
                {...form.getInputProps("title")}
                size="md"
                variant="filled"
                styles={{
                  label: { fontWeight: 500, marginBottom: "12px" },
                  input: {
                    borderRadius: "8px",
                  },
                }}
                aria-label="Workspace title input"
              />

              <Textarea
                label="Description"
                placeholder="Write something about the workspace"
                {...form.getInputProps("description")}
                size="md"
                variant="filled"
                minRows={4}
                styles={{
                  label: { fontWeight: 500, marginBottom: "12px" },
                  input: {
                    borderRadius: "8px",
                  },
                }}
                aria-label="Workspace description input"
              />

              <Group justify="center" mt="md" gap="lg">
                <Button
                  type="submit"
                  size="md"
                  variant="gradient"
                  loading={isLoading}
                  gradient={{ from: "blue", to: "cyan", deg: 90 }}
                  disabled={form.values.title.length === 0}
                  style={{
                    borderRadius: "8px",
                  }}
                >
                  Submit
                </Button>
                <Button
                  size="md"
                  variant="outline"
                  style={{
                    borderRadius: "8px",
                  }}
                  className={classes.cancelButton}
                  onClick={() => form.reset()}
                >
                  Cancel
                </Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Box>
  );
};

export default CreateProjectForm;
