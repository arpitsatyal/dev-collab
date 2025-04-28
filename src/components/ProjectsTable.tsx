import { Table, Text } from "@mantine/core";
import Link from "next/link";
import Loading from "./Loader";
import { Project } from "@prisma/client";

interface ProjectsTable {
  isLoading: boolean;
  error: any;
  projects: Project[];
}

const ProjectsTable = ({ isLoading, error, projects }: ProjectsTable) => {
  const rows = projects.map((project, index) => (
    <Table.Tr key={project.id}>
      <Table.Td>{index + 1}</Table.Td>
      <Table.Td>
        <Link href={`/projects/${project.id}`}>{project.id}</Link>
      </Table.Td>
      <Table.Td>{project.title}</Table.Td>
    </Table.Tr>
  ));

  return isLoading ? (
    <Loading />
  ) : (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>S.No</Table.Th>
          <Table.Th>ID</Table.Th>
          <Table.Th>Title</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {error ? (
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
