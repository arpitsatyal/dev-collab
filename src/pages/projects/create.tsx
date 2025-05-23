import {
  Box,
  Button,
  TextInput,
  Group,
  Textarea,
  Paper,
  useMantineColorScheme,
  Stack,
  Title,
} from "@mantine/core";
import Layout from "../../components/Layout";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/router";
import { withAuth } from "../../guards/withAuth";
import { ProjectCreateData } from "../api/projects";
import { createNewProject } from "../../store/thunks";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

const CreateProject = () => {
  const router = useRouter();
  const form = useForm<ProjectCreateData>({
    initialValues: {
      title: "",
      description: "",
      ownerId: "",
    },
  });

  const { colorScheme } = useMantineColorScheme();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((state) => state.project.isCreating);

  const handleSubmit = async () => {
    try {
      const newProject = await dispatch(createNewProject(form.values));
      notifications.show({
        title: "Job done!",
        message: "Project created successfully! 🌟",
      });
      router.push(`/projects/${newProject.id}`);
    } catch (error) {
      notifications.show({
        title: "Whooops",
        message: "Project could be created.",
      });
    }
  };

  const backgroundColor = colorScheme === "dark" ? "dark.6" : "white";
  const labelColor = colorScheme === "dark" ? "gray.0" : "gray.8";
  const inputBackground = colorScheme === "dark" ? "dark.7" : "gray.0";
  const textColor = colorScheme === "dark" ? "gray.0" : "gray.8";

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
        bg={backgroundColor}
      >
        <Stack gap="md">
          <Title order={4} c={textColor}>
            Create New Project
          </Title>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="sm">
              <TextInput
                label="Title"
                placeholder="Enter a title"
                {...form.getInputProps("title")}
                size="md"
                variant="filled"
                styles={{
                  label: { fontWeight: 500, color: labelColor },
                  input: {
                    borderRadius: "8px",
                    backgroundColor: inputBackground,
                    color: textColor,
                  },
                }}
                aria-label="Project title input"
              />

              <Textarea
                label="Description"
                placeholder="Write something about the project"
                {...form.getInputProps("description")}
                size="md"
                variant="filled"
                minRows={4}
                styles={{
                  label: { fontWeight: 500, color: labelColor },
                  input: {
                    borderRadius: "8px",
                    backgroundColor: inputBackground,
                    color: textColor,
                  },
                }}
                aria-label="Project description input"
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
                  color={colorScheme === "dark" ? "gray.5" : "gray.6"}
                  style={{
                    borderRadius: "8px",
                  }}
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

CreateProject.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export const getServerSideProps = withAuth(async () => {
  return {
    props: {
      colorScheme: "light",
    },
  };
});

export default CreateProject;
