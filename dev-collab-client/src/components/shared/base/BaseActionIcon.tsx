import { ActionIcon, ActionIconProps } from "@mantine/core";
import React from "react";

interface BaseActionIconProps extends ActionIconProps {
    children: React.ReactNode;
}

const BaseActionIcon = React.forwardRef<HTMLButtonElement, BaseActionIconProps & React.ComponentPropsWithoutRef<"button">>(
    ({ radius = "md", ...props }, ref) => {
        return <ActionIcon ref={ref} radius={radius} {...props} />;
    }
);

BaseActionIcon.displayName = "BaseActionIcon";

export default BaseActionIcon;
