import { Switch, SwitchProps } from "@mantine/core";
import React from "react";

type BaseSwitchProps = SwitchProps;

const BaseSwitch = ({ radius = "md", ...props }: BaseSwitchProps) => {
  return <Switch radius={radius} {...props} />;
};

export default BaseSwitch;
