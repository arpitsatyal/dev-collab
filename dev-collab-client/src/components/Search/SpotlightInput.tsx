import BaseActionIcon from "../shared/base/BaseActionIcon";
import React from "react";
import {  TextInput, Box } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { spotlight } from "@mantine/spotlight";
import ShortcutHint from "./ShortcutHint";
import classes from "./SpotlightSearch.module.css";

interface SpotlightInputProps {
  isSmallScreen: boolean;
}

const SpotlightInput: React.FC<SpotlightInputProps> = ({ isSmallScreen }) => {
  return (
    <Box>
      {!isSmallScreen ? (
        <TextInput
          placeholder="Search"
          leftSection={
            <IconSearch
              size={18}
              style={{
                cursor: "pointer" }}
              onClick={() => spotlight.open()}
            />
          }
          rightSection={<ShortcutHint />}
          radius="md"
          styles={{
            input: {
              cursor: "pointer",
              "&:focus": {
                outline: "none" } } }}
          onClick={() => spotlight.open()}
          onFocus={(e) => e.target.blur()}
          readOnly
        />
      ) : (
        <BaseActionIcon
          variant="light"
          onClick={() => spotlight.open()}
          radius="xl"
          size="lg"
          className={classes.icon}
          style={{ transition: "all 0.2s ease" }}
        >
          <IconSearch size={20} />
        </BaseActionIcon>
      )}
    </Box>
  );
};

export default SpotlightInput;
