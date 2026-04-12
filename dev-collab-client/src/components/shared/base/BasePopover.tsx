import { Popover, PopoverProps } from "@mantine/core";
import React from "react";

export interface BasePopoverProps extends PopoverProps {}

const BasePopover = (props: BasePopoverProps) => {
  return <Popover {...props} />;
};

BasePopover.Target = Popover.Target;
BasePopover.Dropdown = Popover.Dropdown;

export default BasePopover;
