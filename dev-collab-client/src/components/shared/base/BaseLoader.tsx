import { Box, Loader, Text, Group } from "@mantine/core";
import spinnerSVG from "../../../../public/infinite-spinner.svg";
import Image from "next/image";
import React from "react";

export interface BaseLoaderProps {
  isEditorLoading?: boolean;
  loaderHeight?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const BaseLoader = ({
  isEditorLoading = false,
  loaderHeight,
  size = "sm" }: BaseLoaderProps) => {
  return (
    <Box
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: loaderHeight ?? "80vh" }}
    >
      {isEditorLoading ? (
        <Group>
          <Image src={spinnerSVG} alt="loading..." height={36} width={36} />
          <Text size="20">Loading Editor...</Text>
        </Group>
      ) : (
        <Loader size={size} />
      )}
    </Box>
  );
};

export default BaseLoader;
