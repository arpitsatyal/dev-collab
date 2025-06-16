import { Box, Switch, Text } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import { SetStateAction } from "react";
import { SaveStatus } from "../../types";

interface AutoSaveSwitchProps {
  autoSaveOn: boolean;
  saveStatus: SaveStatus;
  setAutoSaveOn: (value: SetStateAction<boolean>) => void;
}

const AutoSaveSwitch = ({
  autoSaveOn,
  setAutoSaveOn,
  saveStatus,
}: AutoSaveSwitchProps) => {
  return (
    <Box w={{ base: "100%", md: "auto" }}>
      <Switch
        checked={autoSaveOn}
        onChange={(event) => setAutoSaveOn(event.currentTarget.checked)}
        color="#0074C2"
        size="md"
        label="Auto Save"
        thumbIcon={
          autoSaveOn ? (
            <IconCheck
              size={12}
              color="var(--mantine-color-teal-6)"
              stroke={3}
            />
          ) : (
            <IconX size={12} color="var(--mantine-color-red-6)" stroke={3} />
          )
        }
      />
      <Text
        c={saveStatus === "saving" ? "yellow" : "green"}
        fs="italic"
        fz="xs"
        mt="xs"
        style={{
          visibility: saveStatus ? "visible" : "hidden",
          minHeight: 16,
        }}
      >
        {saveStatus === "saving" && "Saving..."}
        {saveStatus === "saved" && "All changes saved."}
      </Text>
    </Box>
  );
};

export default AutoSaveSwitch;
