import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { debounce } from "lodash";

export const useSearch = (term: string) => {
  const [loading, setLoading] = useState(false);
  const [snippets, setSnippets] = useState<any[]>([]);

  const debouncedFetch = useMemo(() => {
    let controller: AbortController | null = null;

    const fetchData = async (query: string) => {
      if (controller) {
        controller.abort(); // Abort previous request
      }

      controller = new AbortController();
      setLoading(true);

      try {
        const encodedQuery = encodeURIComponent(query);
        const { data } = await axios.post(
          `${process.env.SEARCH_SERVICE_URL}/search?query=${encodedQuery}`,
          {},
          { signal: controller.signal }
        );
        setSnippets(data);
      } catch (err: any) {
        if (axios.isCancel(err)) {
          console.log("Request canceled", err.message);
        } else {
          console.error("Failed to fetch snippet:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    const debounced = debounce(fetchData, 500);

    // Attach cancel method for useEffect cleanup
    (debounced as any).cancelController = () => {
      if (controller) controller.abort();
      debounced.cancel();
    };

    return debounced;
  }, []);

  useEffect(() => {
    if (!term) return;

    debouncedFetch(term);

    return () => {
      (debouncedFetch as any).cancelController?.();
    };
  }, [term, debouncedFetch]);

  return { matchedResults: snippets, loading };
};
