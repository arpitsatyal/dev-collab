import { NavLink, Tooltip } from "@mantine/core";
import styles from "./Docs.module.css";
import { getSingleQueryParam } from "../../utils/getSingleQueryParam";
import { IconBrandPagekit } from "@tabler/icons-react";
import Loading from "../Loader/Loader";
import { useGetDocsQuery } from "../../store/api/docsApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { useRouter } from "next/router";

const DocsSideNav = () => {
  const router = useRouter();
  const workspaceId = getSingleQueryParam(router.query.workspaceId) || "unknown";
  const currentDocId = getSingleQueryParam(router.query.docId) || "";

  const isValidWorkspaceId =
    typeof workspaceId === "string" && workspaceId.trim() !== "";

  const { data: docs, isLoading } = useGetDocsQuery(
    isValidWorkspaceId ? { workspaceId } : skipToken
  );

  if (isLoading || !isValidWorkspaceId) return <Loading loaderHeight="20vh" />;
  return (
    <nav className={styles.sidenav}>
      {docs && docs.length > 0 ? (
        docs.map((item) => (
          <Tooltip
            label={item.label}
            key={item.id}
            position="right"
            withArrow
            openDelay={500}
          >
            <NavLink
              label={item.label}
              leftSection={<IconBrandPagekit size={16} />}
              active={currentDocId === item.id}
              onClick={() =>
                router.push(
                  {
                    pathname: `/workspaces/${workspaceId}/docs`,
                    query: { docId: item.id },
                  },
                  undefined,
                  { shallow: true }
                )
              }
              className={styles.navLink}
            />
          </Tooltip>
        ))
      ) : (
        <div className={styles.noDocs}>No docs available</div>
      )}
    </nav>
  );
};

export default DocsSideNav;
