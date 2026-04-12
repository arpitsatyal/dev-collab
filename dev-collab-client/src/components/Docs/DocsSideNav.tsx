import BaseTooltip from "../shared/base/BaseTooltip";
import { NavLink } from "@mantine/core";
import styles from "./Docs.module.css";
import { IconBrandPagekit } from "@tabler/icons-react";
import BaseLoader from "../shared/base/BaseLoader";
import { useDocsSideNav } from "../../hooks/useDocsSideNav";

const DocsSideNav = () => {
  const { docs, isLoading, isWorkspaceReady, currentDocId, handleDocClick } = useDocsSideNav();

  if (isLoading || !isWorkspaceReady) return <BaseLoader loaderHeight="20vh" />;
  return (
    <nav className={styles.sidenav}>
      {docs && docs.length > 0 ? (
        docs.map((item) => (
          <BaseTooltip
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
          </BaseTooltip>
        ))
      ) : (
        <div className={styles.noDocs}>No docs available</div>
      )}
    </nav>
  );
};

export default DocsSideNav;
