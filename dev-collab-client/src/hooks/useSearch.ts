import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import apiClient from "../lib/apiClient";
import { debounce, isEqual } from "lodash";
import { normalizeQuery } from "../utils/navigation/normalizeQuery";
import { TypedItems } from "../types";
import {
  saveEntry,
  getAllEntries,
  trimStore,
} from "../lib/browser/indexedDB";

const searchCache = new Map<string, TypedItems[]>();

export const useSearch = (term: string) => {
  const [loading, setLoading] = useState(false);
  const [matchedResults, setMatchedResults] = useState<TypedItems[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [ringLoader, setRingLoader] = useState(false);
  const [resultsKey, setResultsKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Save to IndexedDB
  const saveToDB = async (query: string, results: TypedItems[]) => {
    try {
      const normalizedQuery = normalizeQuery(query);
      await saveEntry("searchCache", {
        query: normalizedQuery,
        results,
        timestamp: Date.now(),
      });
      await trimStore("searchCache", 50);
    } catch (error) {
      console.error("Failed to save to IndexedDB:", error);
    }
  };

  const debouncedFetch = useMemo(() => {
    let controller: AbortController | null = null;

    const fetchData = async (query: string, showLoading = true) => {
      const trimmedQuery = query.trim();
      const normalizedQuery = normalizeQuery(trimmedQuery);

      if (controller) {
        controller.abort();
      }

      controller = new AbortController();

      try {
        setError(null);
        if (showLoading) {
          setLoading(true);
        } else {
          setRingLoader(true);
        }

        const { data } = await apiClient.get("/search", {
          params: { query: trimmedQuery },
          signal: controller.signal,
        });

        const cachedData = searchCache.get(normalizedQuery);
        if (data.length && !isEqual(data, cachedData)) {
          setMatchedResults(data);
          setResultsKey((prev) => prev + 1);

          searchCache.set(normalizedQuery, data);
          await saveToDB(normalizedQuery, data);
        }
      } catch (err: any) {
        if (axios.isCancel(err)) {
          console.log("Request canceled", err.message);
        } else {
          console.error("Failed to fetch search results:", err);
          setError(
            err.response?.data?.message ||
            err.message ||
            "Failed to fetch search results",
          );
        }
      } finally {
        if (showLoading) {
          setLoading(false);
        } else {
          setRingLoader(false);
        }
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
    const init = async () => {
      try {
        const allEntries: any[] = await getAllEntries("searchCache");
        const now = Date.now();
        const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

        // Filter out expired entries and populate searchCache
        allEntries.forEach((entry) => {
          if (now - entry.timestamp < CACHE_EXPIRY_MS) {
            searchCache.set(entry.query, entry.results);
          }
        });

        await trimStore("searchCache", 50);
      } catch (error) {
        console.error("Failed to initialize IndexedDB:", error);
      }
    };

    init();
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
    const normalizedTerm = normalizeQuery(trimmedTerm);
    if (searchCache.has(normalizedTerm)) {
      setMatchedResults(searchCache.get(normalizedTerm)!);
      setResultsKey((prev) => prev + 1);

      setIsTyping(false);
      debouncedFetch(trimmedTerm, false);
    } else {
      debouncedFetch(trimmedTerm);
    }

    // const fuzzyResult = findClosestCacheMatch(term);
    // if (fuzzyResult) {
    //   setMatchedResults(fuzzyResult);
    //   setIsTyping(false);
    // }

    return () => {
      (debouncedFetch as any).cancelController?.();
    };
  }, [term, debouncedFetch]);

  return {
    matchedResults,
    searchCache,
    loading,
    isTyping,
    ringLoader,
    resultsKey,
    error,
  };
};
