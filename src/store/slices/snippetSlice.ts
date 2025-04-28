import { Snippet } from "@prisma/client";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface SnippetsState {
  loadedSnippets: Record<string, Snippet[]>;
}

const initialState: SnippetsState = {
  loadedSnippets: {},
};

export const SnippetSlice = createSlice({
  name: "snippet",
  initialState,
  reducers: {
    setSnippets: (
      state,
      action: PayloadAction<{ projectId: string; snippets: Snippet[] }>
    ) => {
      const { projectId, snippets } = action.payload || {};
      state.loadedSnippets[projectId] = snippets;
    },
    addSnippet: (
      state,
      action: PayloadAction<{ projectId: string; snippet: Snippet }>
    ) => {
      const { projectId, snippet } = action.payload;
      state.loadedSnippets[projectId] = [
        ...(state.loadedSnippets[projectId] || []),
        snippet,
      ];
    },
    updateSnippet: (
      state,
      action: PayloadAction<{
        projectId: string;
        snippetId: string;
        editedSnippet: Partial<Snippet>;
      }>
    ) => {
      const { projectId, snippetId, editedSnippet } = action.payload || {};

      const snippetIndex = state.loadedSnippets[projectId].findIndex(
        (snippet) => snippet.id === snippetId
      );

      if (snippetIndex != -1) {
        state.loadedSnippets[projectId][snippetIndex] = {
          ...state.loadedSnippets[projectId][snippetIndex],
          ...editedSnippet,
        };
      }
    },
  },
});

export const { setSnippets, addSnippet, updateSnippet } = SnippetSlice.actions;

export default SnippetSlice.reducer;
