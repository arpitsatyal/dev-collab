import { MantineThemeOverride } from "@mantine/core";

const myPrimaryColor = [
  "#e3f2fd",
  "#bbdefb",
  "#90caf9",
  "#64b5f6",
  "#42a5f5",
  "#0074c2",
  "#1e88e5",
  "#1976d2",
  "#1565c0",
  "#0d47a1",
];

export const theme: MantineThemeOverride = {
  colors: {
    custom: myPrimaryColor as any,
  },
  primaryColor: "custom",
  primaryShade: {
    light: 5,
    dark: 8,
  },
  components: {
    ActionIcon: {
      styles: {
        root: {
          outline: "none",
        },
      },
    },
  },
};
