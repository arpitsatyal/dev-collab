import { ActionIcon, Tooltip } from "@mantine/core";
import { IconCheck, IconCodePlus, IconLoader2 } from "@tabler/icons-react";

interface SnippetExportTriggerProps {
  saved: boolean;
  isLoading: boolean;
  onClick: () => void;
}

const SnippetExportTrigger = ({ saved, isLoading, onClick }: SnippetExportTriggerProps) => {
  return (
    <Tooltip label={saved ? "Saved" : "Save as snippet"} withArrow>
      <ActionIcon
        onClick={onClick}
        variant="light"
        color={saved ? "teal" : "gray"}
        size="sm"
        loading={isLoading}
        aria-label="Save code block as snippet"
      >
        {isLoading ? (
          <IconLoader2 size={14} />
        ) : saved ? (
          <IconCheck size={14} />
        ) : (
          <IconCodePlus size={14} />
        )}
      </ActionIcon>
    </Tooltip>
  );
};

export default SnippetExportTrigger;
