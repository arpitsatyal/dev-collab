import { useRouter } from "next/router";
import { NavLink } from "@mantine/core";
import styles from "./Docs.module.css";
import { getSingleQueryParam } from "../../utils/getSingleQueryParam";
import { IconBrandPagekit } from "@tabler/icons-react";
import Loading from "../Loader/Loader";
import { useGetDocsQuery } from "../../store/api/docsApi";
import { skipToken } from "@reduxjs/toolkit/query";

const DocsSideNav = () => {
  const router = useRouter();
  const projectId = getSingleQueryParam(router.query.projectId) || "unknown";
  const currentDocId = getSingleQueryParam(router.query.docId) || "";

  const isValidProjectId =
    typeof projectId === "string" && projectId.trim() !== "";

  const { data: docs, isLoading } = useGetDocsQuery(
    isValidProjectId ? { projectId } : skipToken
  );

  if (isLoading || !isValidProjectId) return <Loading loaderHeight="20vh" />;
  return (
    <nav className={styles.sidenav}>
      {docs && docs.length > 0 ? (
        docs.map((item) => (
          <NavLink
            key={item.id}
            label={item.label}
            leftSection={<IconBrandPagekit size={16} />}
            active={currentDocId === item.id}
            onClick={() =>
              router.push(
                {
                  pathname: `/projects/${projectId}/docs`,
                  query: { docId: item.id },
                },
                undefined,
                { shallow: true }
              )
            }
            className={styles.navLink}
          />
        ))
      ) : (
        <div className={styles.noDocs}>No docs available</div>
      )}
    </nav>
  );
};

export default DocsSideNav;
