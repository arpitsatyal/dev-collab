import BaseTooltip from "../shared/base/BaseTooltip";

import { useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import BaseActionIcon from "../shared/base/BaseActionIcon";
import { IconMoon, IconSun } from "@tabler/icons-react";
import React from "react";
import cx from "clsx";
import classes from "./ThemeToggle.module.css";

const ThemeToggle = () => {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  return (
    <BaseTooltip label="Toggle theme" position="bottom">
      <BaseActionIcon
        onClick={() =>
          setColorScheme(computedColorScheme === "light" ? "dark" : "light")
        }
        variant="default"
        size="xl"
        aria-label="Toggle color scheme"
      >
        <IconSun className={cx(classes.icon, classes.light)} stroke={1.5} />
        <IconMoon className={cx(classes.icon, classes.dark)} stroke={1.5} />
      </BaseActionIcon>
    </BaseTooltip>
  );
};

export default ThemeToggle;
