import { Box, Button, TextInput, Group, Textarea, Paper } from "@mantine/core";
import Layout from "../../components/Layout";
import { useForm } from "@mantine/form";
import { ProjectCreate } from "../../interfaces";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/router";
import { useCreateProjectMutation } from "../../store/api/projectApi";

const CreateProject = () => {
  const router = useRouter();
  const form = useForm<ProjectCreate>({
    initialValues: {
      title: "",
      description: "",
      id: "",
    },
  });

  const [createProject, { isLoading }] = useCreateProjectMutation();

  const handleSubmit = async () => {
    try {
      await createProject(form.values).unwrap();
      router.push("/projects");
      notifications.show({
        title: "Job done!",
        message: "Project created successfully! 🌟",
      });
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Whooops",
        message: "Project cannot be created.",
      });
    }
  };

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
        style={{
          backgroundColor: "#ffffff",
        }}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label="Title"
            placeholder="Enter a title"
            {...form.getInputProps("title")}
            size="md"
            variant="filled"
            mb="md"
            styles={{
              label: { fontWeight: 500, color: "#1a1b1e" },
              input: {
                borderRadius: "8px",
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
            mb="md"
            styles={{
              label: { fontWeight: 500, color: "#1a1b1e" },
              input: {
                borderRadius: "8px",
              },
            }}
            aria-label="Project description input"
          />

          <Group justify="flex-end" mt="lg">
            <Button
              type="submit"
              size="md"
              variant="gradient"
              loading={isLoading}
              gradient={{ from: "blue", to: "cyan", deg: 90 }}
              disabled={form.values.title.length === 0}
              fullWidth={true}
              style={{
                borderRadius: "8px",
              }}
            >
              Submit
            </Button>
          </Group>
        </form>
      </Paper>
    </Box>
  );
};

CreateProject.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export default CreateProject;
