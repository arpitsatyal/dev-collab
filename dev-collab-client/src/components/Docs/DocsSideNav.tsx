import { NavLink, Tooltip } from "@mantine/core";
import styles from "./Docs.module.css";
import { IconBrandPagekit } from "@tabler/icons-react";
import Loading from "../Loader/Loader";
import { useDocsSideNav } from "../../hooks/useDocsSideNav";

const DocsSideNav = () => {
  const { docs, isLoading, isWorkspaceReady, currentDocId, handleDocClick } = useDocsSideNav();

  if (isLoading || !isWorkspaceReady) return <Loading loaderHeight="20vh" />;
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
              onClick={() => handleDocClick(item.id)}
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
