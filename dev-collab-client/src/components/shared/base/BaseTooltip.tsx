import { Tooltip, TooltipProps } from "@mantine/core";
import React from "react";

export interface BaseTooltipProps extends TooltipProps {}

const BaseTooltip = (props: BaseTooltipProps) => {
  return <Tooltip {...props} />;
};

export default BaseTooltip;
