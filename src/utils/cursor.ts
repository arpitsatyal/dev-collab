import { createStyles } from "@mantine/emotion";

export const useCursorStyles = createStyles((theme) => ({
  remoteCursor: {
    position: "absolute",
    borderLeft: `2px solid ${theme.colors.pink[6]}`,
    pointerEvents: "none",
    zIndex: 10,
  },
  remoteCursorLabel: {
    "&::after": {
      content: '"●"',
      position: "absolute",
      color: theme.colors.pink[6],
      fontSize: 11,
      marginLeft: 4,
      top: "-1.2em",
    },
  },
}));
