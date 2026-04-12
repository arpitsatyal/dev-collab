import { Modal, ModalProps } from "@mantine/core";
import React from "react";

interface BaseModalProps extends ModalProps {
    // Custom props if needed
}

const BaseModal = ({ centered = true, radius = "md", ...props }: BaseModalProps) => {
    return <Modal centered={centered} radius={radius} {...props} />;
};

export default BaseModal;
