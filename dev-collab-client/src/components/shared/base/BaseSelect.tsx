import { Select, SelectProps } from "@mantine/core";
import React from "react";

interface BaseSelectProps extends SelectProps {
    // Custom props if needed
}

const BaseSelect = ({ radius = "md", ...props }: BaseSelectProps) => {
    return (
        <Select
            radius={radius}
            styles={{
                label: { fontWeight: 500, marginBottom: "8px" },
                input: { borderRadius: "8px" } }}
            {...props}
        />
    );
};

export default BaseSelect;
