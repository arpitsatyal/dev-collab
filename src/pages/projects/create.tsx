import Layout from "../../components/Layout/Layout";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/router";
import { withAuth } from "../../guards/withAuth";
import { ProjectCreateData } from "../api/projects";
import { syncMeiliSearch } from "../../utils/syncMeiliSearch";
import CreateProjectForm from "../../components/Projects/CreateProjectForm";
import ImportProjectForm from "../../components/Projects/ImportProjectForm";
import { useCreateProjectMutation } from "../../store/api/projectApi";
import { useState } from "react";
import { SegmentedControl, Center, Box, Title } from "@mantine/core";

const CreateProjectPage = () => {
  const router = useRouter();
  const [mode, setMode] = useState<string>("manual");
  const form = useForm<ProjectCreateData>({
    initialValues: {
      title: "",
      description: "",
      ownerId: "",
    },
  });

  const [createProject, { isLoading }] = useCreateProjectMutation();

  const handleSubmit = async () => {
    try {
      const newProject = await createProject(form.values).unwrap();
      notifications.show({
        title: "Job done!",
        message: "Project created successfully! 🌟",
      });
      router.push(`/projects/${newProject.id}`);

      await syncMeiliSearch(newProject, "project");
    } catch (error) {
      notifications.show({
        title: "Whooops",
        message: "Project could be created.",
      });
    }
  };

  return (
    <Box py="xl">
      <Center mb="xl">
        <SegmentedControl
          value={mode}
          onChange={setMode}
          data={[
            { label: "Create Manually", value: "manual" },
            { label: "Import from GitHub", value: "import" },
          ]}
          size="md"
          radius="md"
        />
      </Center>

      {mode === "manual" ? (
        <CreateProjectForm
          form={form}
          isLoading={isLoading}
          handleSubmit={handleSubmit}
        />
      ) : (
        <ImportProjectForm />
      )}
    </Box>
  );
};

CreateProjectPage.getLayout = (page: React.ReactElement) => (
  <Layout>{page}</Layout>
);

export const getServerSideProps = withAuth(async () => {
  return {
    props: {},
  };
});

export default CreateProjectPage;
