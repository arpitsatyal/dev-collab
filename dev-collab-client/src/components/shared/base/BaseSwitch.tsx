import { Switch, SwitchProps } from "@mantine/core";
import React from "react";

interface BaseSwitchProps extends SwitchProps {
  // Custom props if needed
}

const BaseSwitch = ({ radius = "md", ...props }: BaseSwitchProps) => {
  return <Switch radius={radius} {...props} />;
};

export default BaseSwitch;
