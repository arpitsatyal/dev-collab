import { Button, ButtonProps } from "@mantine/core";
import React from "react";

interface BaseButtonProps extends ButtonProps {
    children: React.ReactNode;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    type?: "submit" | "button" | "reset";
}

const BaseButton = ({ children, radius = "md", ...props }: BaseButtonProps) => {
    return (
        <Button radius={radius} {...props}>
            {children}
        </Button>
    );
};

export default BaseButton;
