import { Box, Button, TextInput, Group } from "@mantine/core";
import Layout from "../../components/Layout";
import { useForm } from "@mantine/form";
import axios from "axios";
import { Project } from "../../interfaces/project";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/router";

const CreateProject = () => {
  const router = useRouter();
  const form = useForm<Project>({
    initialValues: {
      title: "",
      id: "",
    },
  });

  const handleSubmit = async () => {
    try {
      await axios.post(`/api/projects/`, form.values);
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
    <Box maw={300} p="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          label="Title"
          placeholder="Enter a title"
          {...form.getInputProps("title")}
          mb="md"
        />

        <Group justify="flex-end">
          <Button
            type="submit"
            fullWidth
            mt="sm"
            disabled={form.values.title.length === 0}
          >
            Submit
          </Button>
        </Group>
      </form>
    </Box>
  );
};

CreateProject.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export default CreateProject;
