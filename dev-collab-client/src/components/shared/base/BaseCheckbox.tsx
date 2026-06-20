import { Checkbox, CheckboxProps } from "@mantine/core";
import React from "react";

type BaseCheckboxProps = CheckboxProps;

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
