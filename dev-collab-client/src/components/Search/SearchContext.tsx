import React, { createContext, useContext } from "react";
import { Snippet, TypedItems, WorkspaceWithPin } from "../../types";

export interface SearchContextValue {
  query: string;
  matchedResults: TypedItems[];
  isSearchLoading: boolean;
  workspaces?: WorkspaceWithPin[];
  snippets: Snippet[];
  recentSearchOrder: string[];
  recentItems: TypedItems[];
  addRecentItems: (items: TypedItems[]) => void;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export const SpotlightSearchProvider = ({
  value,
  children,
}: {
  value: SearchContextValue;
  children: React.ReactNode;
}) => {
  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
};

export const useSpotlightSearchContext = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error(
      "useSpotlightSearchContext must be used within a SpotlightSearchProvider",
    );
  }
  return context;
};
