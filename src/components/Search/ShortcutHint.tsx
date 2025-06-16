import { Box, Paper, Text } from "@mantine/core";
import { spotlight } from "@mantine/spotlight";
import classes from "./SpotlightSearch.module.css";

const ShortcutHint = ({ openSpotlight }: any) => (
  <Box pr={40} style={{ cursor: "pointer" }} onClick={openSpotlight}>
    <Paper shadow="xs" w={60} p={5} className={classes.shortcut}>
      <Text size="xs" fw={700} lh={1}>
        Ctrl + K
      </Text>
    </Paper>
  </Box>
);

export default ShortcutHint;
