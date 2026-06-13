import { Text, Box } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

interface CollapsibleTextProps {
  text: string;
  lineClamp?: number;
  maxLength?: number;
}

const CollapsibleText = ({
  text,
  lineClamp = 2,
  maxLength = 80,
}: CollapsibleTextProps) => {
  const [expanded, { toggle }] = useDisclosure(false);

  if (!text) return null;

  const shouldShowToggle = text.length > maxLength;

  return (
    <Box onClick={(e) => e.stopPropagation()}>
      <Text
        size="sm"
        c="dimmed"
        lineClamp={expanded ? undefined : lineClamp}
        style={{ transition: "all 0.2s ease" }}
      >
        {text}
      </Text>
      {shouldShowToggle && (
        <Text
          size="xs"
          c="blue"
          span
          style={{ cursor: "pointer", fontWeight: 500 }}
          onClick={toggle}
        >
          {expanded ? "See less" : "See more"}
        </Text>
      )}
    </Box>
  );
};

export default CollapsibleText;
