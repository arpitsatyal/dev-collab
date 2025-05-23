import { Box, Tooltip, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import React from "react";

const ThemeToggle = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <Tooltip label="Toggle theme" position="bottom">
      <Box
        pr={10}
        role="button"
        aria-label="Toggle color scheme"
        onClick={() =>
          setColorScheme(colorScheme === "dark" ? "light" : "dark")
        }
        style={{
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          transition: "transform 0.2s",
          "&:hover": {
            transform: "scale(1.1)",
          },
        }}
      >
        {colorScheme === "dark" ? <IconMoon /> : <IconSun />}
      </Box>
    </Tooltip>
  );
};

export default ThemeToggle;
