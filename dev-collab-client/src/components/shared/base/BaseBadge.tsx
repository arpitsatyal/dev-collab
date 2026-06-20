import { Badge, BadgeProps } from "@mantine/core";
import React from "react";

interface BaseBadgeProps extends BadgeProps {
  children: React.ReactNode;
}

const BaseBadge = ({ radius = "md", ...props }: BaseBadgeProps) => {
  return <Badge radius={radius} {...props} />;
};

export default BaseBadge;
