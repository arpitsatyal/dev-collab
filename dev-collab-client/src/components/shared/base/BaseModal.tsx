import { Modal, ModalProps } from "@mantine/core";
import React from "react";

type BaseModalProps = ModalProps;

const BaseModal = ({
  centered = true,
  radius = "md",
  ...props
}: BaseModalProps) => {
  return <Modal centered={centered} radius={radius} {...props} />;
};

export default BaseModal;
