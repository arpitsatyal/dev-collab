import { useState, useEffect } from "react";
import axios from "axios";
import { Snippet } from "../interfaces";

export const useSnippet = (projectId?: string, snippetId?: string) => {
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || !snippetId) {
      setLoading(false);
      return;
    }

    const fetchSnippet = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `/api/snippets?projectId=${projectId}&snippetId=${snippetId}`
        );
        setSnippet(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch snippets:", err);
        setError("Failed to fetch snippets");
      } finally {
        setLoading(false);
      }
    };

    fetchSnippet();
  }, [projectId, snippetId]);

  return { snippet, loading, error };
};
