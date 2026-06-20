import { Tooltip, TooltipProps } from "@mantine/core";
import React from "react";

export type BaseTooltipProps = TooltipProps;

const BaseTooltip = (props: BaseTooltipProps) => {
  return <Tooltip {...props} />;
};

export default BaseTooltip;
