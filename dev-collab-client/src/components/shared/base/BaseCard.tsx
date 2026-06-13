import { Paper, PaperProps } from "@mantine/core";
import React from "react";

interface BaseCardProps extends PaperProps {
  children: React.ReactNode;
}

const BaseCard = ({
  children,
  withBorder = true,
  shadow = "sm",
  p = "md",
  radius = "md",
  ...props
}: BaseCardProps) => {
  return (
    <Paper
      withBorder={withBorder}
      shadow={shadow}
      p={p}
      radius={radius}
      {...props}
    >
      {children}
    </Paper>
  );
};

export default BaseCard;
