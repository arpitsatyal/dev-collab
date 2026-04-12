import React, { createContext, useContext, ReactNode } from "react";
import { useSideNav } from "../../hooks/useSideNav";

type SideNavContextType = ReturnType<typeof useSideNav>;

const SideNavContext = createContext<SideNavContextType | undefined>(undefined);

export const SideNavProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value: SideNavContextType;
}) => {
  return (
    <SideNavContext.Provider value={value}>{children}</SideNavContext.Provider>
  );
};

export const useSideNavContext = () => {
  const context = useContext(SideNavContext);
  if (context === undefined) {
    throw new Error("useSideNavContext must be used within a SideNavProvider");
  }
  return context;
};
