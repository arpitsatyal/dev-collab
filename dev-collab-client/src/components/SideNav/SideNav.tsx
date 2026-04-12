import { AppShell } from "@mantine/core";
import classes from "./SideNav.module.css";
import SideNavFooter from "./SideNavFooter";
import NavItem from "./NavItem";
import { useSideNav } from "../../hooks/useSideNav";
import { SideNavProvider } from "./SideNavContext";
import SideNavNestedContent from "./SideNavNestedContent";

const SideNav = () => {
  const sideNavData = useSideNav();
  const {
    navItemsWithWorkspaces,
    isActive,
    isOpen,
    handleNavClick } = sideNavData;

  return (
    <SideNavProvider value={sideNavData}>
      <AppShell.Section grow my="md" className={classes.section}>
        {navItemsWithWorkspaces.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            active={isActive(item.path, item.id)}
            opened={isOpen(item)}
            onClick={() => handleNavClick(item.path, item.handler, item.label)}
          >
            {item.children !== undefined && <SideNavNestedContent item={item} />}
          </NavItem>
        ))}
      </AppShell.Section>

      <SideNavFooter />
    </SideNavProvider>
  );
};

export default SideNav;
