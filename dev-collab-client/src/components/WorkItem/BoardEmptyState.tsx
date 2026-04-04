import { Center, Text } from "@mantine/core";
import React from "react";

const BoardEmptyState = () => {
  return (
    <Center className="secondary">
      <Text size="lg">No work items yet, create one to get started!</Text>
    </Center>
  );
};

export default BoardEmptyState;
