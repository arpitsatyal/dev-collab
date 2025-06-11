import { Box, Loader, Text, Group } from "@mantine/core";
import spinnerSVG from "../../../public/infinite-spinner.svg";
import Image from "next/image";

const Loading = ({
  isEditorLoading = false,
  loaderHeight,
}: {
  isEditorLoading?: boolean;
  loaderHeight?: string;
}) => {
  return (
    <Box
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: loaderHeight ?? "80vh",
      }}
    >
      {isEditorLoading ? (
        <Group>
          <Image
            priority
            src={spinnerSVG}
            alt="loading..."
            height={36}
            width={36}
          />
          <Text size="20">Loading Editor...</Text>
        </Group>
      ) : (
        <Loader size="sm" />
      )}
    </Box>
  );
};

export default Loading;
