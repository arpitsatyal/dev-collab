import { Loader, Table, Text } from "@mantine/core";
import { Project } from "../interfaces";
import Link from "next/link";
import Loading from "./Loader";

interface ProjectsTable {
  loading: boolean;
  error: any;
  projects: Project[];
}

const ProjectsTable = ({ loading, error, projects }: ProjectsTable) => {
  const rows = projects.map((project) => (
    <Table.Tr key={project.id}>
      <Table.Td>
        <Link href={`/projects/${project.id}`}>{project.id}</Link>
      </Table.Td>
      <Table.Td>{project.title}</Table.Td>
    </Table.Tr>
  ));

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>ID</Table.Th>
          <Table.Th>Title</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {loading ? (
          <Table.Tr>
            <Table.Td colSpan={2} style={{ textAlign: "center" }}>
              <Loading />
            </Table.Td>
          </Table.Tr>
        ) : error ? (
          <Table.Tr>
            <Table.Td colSpan={2} style={{ textAlign: "center" }}>
              <Text c="red">{error}</Text>
            </Table.Td>
          </Table.Tr>
        ) : projects.length === 0 ? (
          <Table.Tr>
            <Table.Td colSpan={2} style={{ textAlign: "center" }}>
              <Text>No projects found</Text>
            </Table.Td>
          </Table.Tr>
        ) : (
          rows
        )}
      </Table.Tbody>
    </Table>
  );
};

export default ProjectsTable;
