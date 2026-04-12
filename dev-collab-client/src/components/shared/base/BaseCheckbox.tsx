import { Checkbox, CheckboxProps } from "@mantine/core";
import React from "react";

interface BaseCheckboxProps extends CheckboxProps {
  // Custom props if needed
}

const BaseCheckbox = ({ radius = "md", ...props }: BaseCheckboxProps) => {
  return (
    <Checkbox
      radius={radius}
      styles={{
        label: { paddingLeft: "8px" },
      }}
      {...props}
    />
  );
};

export default BaseCheckbox;
