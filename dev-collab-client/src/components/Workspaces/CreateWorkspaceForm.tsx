import { Box, Group, Stack, Title } from "@mantine/core";
import BaseButton from "../shared/base/BaseButton";
import BaseInput from "../shared/base/BaseInput";
import BaseCard from "../shared/base/BaseCard";
import BaseTextarea from "../shared/base/BaseTextarea";
import classes from "./Workspace.module.css";
import { useForm } from "@mantine/form";
import { useRouter } from "next/router";
import { WorkspaceCreateData } from "../../types";
import { useWorkspaceMutations } from "../../hooks/mutations/useWorkspaceMutations";

const CreateWorkspaceForm = () => {
  const router = useRouter();
  const { isLoading, handleCreateWorkspace } = useWorkspaceMutations();

  const form = useForm<WorkspaceCreateData>({
    initialValues: {
      title: "",
      description: "",
      ownerId: "",
    },
  });

  const handleSubmit = async () => {
    try {
      const newWorkspace = await handleCreateWorkspace(form.values);
      router.push(`/workspaces/${newWorkspace.id}`);
    } catch (error) {
      // Error handled inside hook (toasts)
    }
  };

  return (
    <Box
      maw={{ base: "100%", sm: 600, md: 800 }}
      mx="auto"
      p={{ base: "sm", sm: "md" }}
    >
      <BaseCard className={classes.root}>
        <Stack gap="md">
          <Title order={4}>Create New Workspace</Title>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="sm">
              <BaseInput
                label="Title"
                placeholder="Enter a title"
                {...form.getInputProps("title")}
                size="md"
                aria-label="Workspace title input"
              />

              <BaseTextarea
                label="Description"
                placeholder="Write something about the workspace"
                {...form.getInputProps("description")}
                size="md"
                minRows={4}
                aria-label="Workspace description input"
              />

              <Group justify="center" mt="md" gap="lg">
                <BaseButton
                  type="submit"
                  size="md"
                  variant="gradient"
                  loading={isLoading}
                  gradient={{ from: "blue", to: "cyan", deg: 90 }}
                  disabled={form.values.title.length === 0}
                >
                  Submit
                </BaseButton>
                <BaseButton
                  size="md"
                  variant="outline"
                  className={classes.cancelButton}
                  onClick={() => form.reset()}
                >
                  Cancel
                </BaseButton>
              </Group>
            </Stack>
          </form>
        </Stack>
      </BaseCard>
    </Box>
  );
};

export default CreateWorkspaceForm;
