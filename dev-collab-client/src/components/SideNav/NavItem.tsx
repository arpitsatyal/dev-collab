import { NavLink } from "@mantine/core";
import type { NavItemProps } from "../../hooks/useSideNav";

interface NavItemSingleProps {
  item: NavItemProps;
  active: boolean;
  opened: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}

const NavItem = ({ item, active, opened, onClick, children }: NavItemSingleProps) => {
  return (
    <NavLink
      key={item.id}
      active={active}
      opened={opened}
      label={item.label}
      leftSection={<item.icon size={16} stroke={1.5} />}
      onClick={onClick}
    >
      {children}
    </NavLink>
  );
};

export default NavItem;
