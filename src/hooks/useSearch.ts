import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { debounce } from "lodash";

const searchCache = new Map<string, any[]>();

export const useSearch = (term: string) => {
  const [loading, setLoading] = useState(false);
  const [matchedResults, setMatchedResults] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const debouncedFetch = useMemo(() => {
    let controller: AbortController | null = null;

    const fetchData = async (query: string) => {
      const trimmedQuery = query.trim();
      if (searchCache.has(trimmedQuery)) {
        setMatchedResults(searchCache.get(trimmedQuery)!);
        setIsTyping(false);
        return;
      }

      if (controller) {
        controller.abort();
      }

      controller = new AbortController();

      try {
        setLoading(true);
        const encodedQuery = encodeURIComponent(trimmedQuery);
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/search?query=${encodedQuery}`,
          {},
          { signal: controller.signal }
        );
        setMatchedResults(data);
        searchCache.set(trimmedQuery, data);
      } catch (err: any) {
        if (axios.isCancel(err)) {
          console.log("Request canceled", err.message);
        } else {
          console.error("Failed to fetch snippet:", err);
        }
      } finally {
        setLoading(false);
        setIsTyping(false);
      }
    };

    const debounced = debounce(fetchData, 500);

    (debounced as any).cancelController = () => {
      if (controller) controller.abort();
      debounced.cancel();
    };

    return debounced;
  }, []);

  useEffect(() => {
    if (!term) {
      setMatchedResults([]);
      setLoading(false);
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    const trimmedTerm = term.trim();
    if (searchCache.has(trimmedTerm)) {
      setMatchedResults(searchCache.get(trimmedTerm)!);
      setIsTyping(false);
      return;
    }

    debouncedFetch(trimmedTerm);

    return () => {
      (debouncedFetch as any).cancelController?.();
    };
  }, [term, debouncedFetch]);

  return {
    matchedResults,
    searchCache,
    loading,
    isTyping,
  };
};
