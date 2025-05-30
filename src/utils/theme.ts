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
    custom: myPrimaryColor as any, // 'custom' is the name of the color
  },
  primaryColor: "custom", // use the custom palette
  primaryShade: 5,
};
