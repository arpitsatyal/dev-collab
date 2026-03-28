import { Snippet } from "../../types";
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
      action: PayloadAction<{ workspaceId: string; snippets: Snippet[] }>
    ) => {
      const { workspaceId, snippets } = action.payload || {};
      state.loadedSnippets[workspaceId] = snippets;
    },
    addSnippet: (
      state,
      action: PayloadAction<{ workspaceId: string; snippet: Snippet }>
    ) => {
      const { workspaceId, snippet } = action.payload;
      const existingSnippets = state.loadedSnippets[workspaceId] || [];

      const alreadyExists = existingSnippets.some((s) => s.id === snippet.id);

      if (!alreadyExists) {
        state.loadedSnippets[workspaceId] = [...existingSnippets, snippet];
      }
    },

    updateSnippet: (
      state,
      action: PayloadAction<{
        workspaceId: string;
        snippetId: string;
        editedSnippet: Partial<Snippet>;
      }>
    ) => {
      const { workspaceId, snippetId, editedSnippet } = action.payload || {};

      const snippetIndex = state.loadedSnippets[workspaceId].findIndex(
        (snippet) => snippet.id === snippetId
      );

      if (snippetIndex != -1) {
        state.loadedSnippets[workspaceId][snippetIndex] = {
          ...state.loadedSnippets[workspaceId][snippetIndex],
          ...editedSnippet,
        };
      }
    },

    removeSnippet: (
      state,
      action: PayloadAction<{ workspaceId: string; snippetId: string }>
    ) => {
      const { workspaceId, snippetId } = action.payload;
      const existingSnippets = state.loadedSnippets[workspaceId];

      if (!existingSnippets) {
        return;
      }

      state.loadedSnippets[workspaceId] = existingSnippets.filter(
        (snippet) => snippet.id !== snippetId
      );
    },
  },
});

export const { setSnippets, addSnippet, updateSnippet, removeSnippet } =
  SnippetSlice.actions;

export default SnippetSlice.reducer;
