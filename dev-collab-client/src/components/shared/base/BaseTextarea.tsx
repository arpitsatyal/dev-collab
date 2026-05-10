import { Textarea, TextareaProps } from "@mantine/core";
import React from "react";

type BaseTextareaProps = TextareaProps;

const BaseTextarea = ({
  radius = "md",
  variant = "filled",
  ...props
}: BaseTextareaProps) => {
  return (
    <Textarea
      radius={radius}
      variant={variant}
      styles={{
        label: { fontWeight: 500, marginBottom: "8px" },
        input: { borderRadius: "8px" },
      }}
      {...props}
    />
  );
};

export default BaseTextarea;
