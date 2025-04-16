import { useRouter } from "next/router";
import Layout from "../../../components/Layout";

const Project = () => {
  const router = useRouter();
  const { projectId } = router.query;
  return <div>Project {projectId}</div>;
};

Project.getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

export default Project;
