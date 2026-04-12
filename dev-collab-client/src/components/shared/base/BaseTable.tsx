import { Table, TableProps } from "@mantine/core";
import React from "react";

interface BaseTableProps extends TableProps {
  // Custom props if needed
}

const BaseTable = ({
  striped = true,
  highlightOnHover = true,
  withTableBorder = true,
  withColumnBorders = true,
  ...props
}: BaseTableProps) => {
  return (
    <Table
      striped={striped}
      highlightOnHover={highlightOnHover}
      withTableBorder={withTableBorder}
      withColumnBorders={withColumnBorders}
      {...props}
    />
  );
};

export default BaseTable;
