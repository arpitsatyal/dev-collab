import { Box, Button, Group } from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";
import ThemeToggle from "../Theme/ThemeToggle";
import { useMediaQuery } from "@mantine/hooks";
import classes from "./SideNav.module.css";
import { useLogout } from "../../hooks/useLogout";

const SideNavFooter = () => {
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const { handleLogout, isLoggingOut } = useLogout();

  return (
    <Box className={classes.bottomDiv}>
      <Group justify="space-between" gap="sm">
        <Button
          variant="light"
          color="red"
          onClick={handleLogout}
          leftSection={<IconLogout size={18} />}
          radius="md"
          size="sm"
          style={{ fontWeight: 500, transition: "all 0.2s ease" }}
        >
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>
        {isSmallScreen && <ThemeToggle />}
      </Group>
    </Box>
  );
};

export default SideNavFooter;
