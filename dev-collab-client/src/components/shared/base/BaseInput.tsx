import { TextInput, TextInputProps } from "@mantine/core";
import React from "react";

interface BaseInputProps extends TextInputProps {
    // Add any custom props here if needed
}

const BaseInput = ({ radius = "md", variant = "filled", ...props }: BaseInputProps) => {
    return (
        <TextInput
            radius={radius}
            variant={variant}
            styles={{
                label: { fontWeight: 500, marginBottom: "8px" },
                input: { borderRadius: "8px" } }}
            {...props}
        />
    );
};

export default BaseInput;
