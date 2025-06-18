import { Box, Button, Group } from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";
import ThemeToggle from "../Theme/ThemeToggle";
import { useMediaQuery } from "@mantine/hooks";
import classes from "./SideNav.module.css";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";

const SideNavFooter = () => {
  const router = useRouter();
  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  const handleLogout = () => {
    signOut();
    router.push("/");
  };

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
          Logout
        </Button>
        {isSmallScreen && <ThemeToggle />}
      </Group>
    </Box>
  );
};

export default SideNavFooter;
