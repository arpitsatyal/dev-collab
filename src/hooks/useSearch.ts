import { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { debounce, isEqual } from "lodash";
import { IDBPDatabase } from "idb";
import { initDB } from "../lib/indexedDB";
import { normalizeQuery } from "../utils/normalizeQuery";
import { TypedItems } from "../types";
import { levenshtein } from "../utils/levenshtein";

const MAX_CACHE_SIZE = 50;
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const FUZZY_MATCH_THRESHOLD = 2;

interface CacheEntry {
  query: string;
  results: TypedItems[];
  timestamp: number;
}

const searchCache = new Map<string, TypedItems[]>();

const findClosestCacheMatch = (term: string): TypedItems[] | null => {
  let bestMatch: string | null = null;
  let bestDistance = Infinity;

  if (term.length < 3) return null;
  for (const key of searchCache.keys()) {
    const distance = levenshtein(normalizeQuery(term), key);
    if (distance < bestDistance && distance <= FUZZY_MATCH_THRESHOLD) {
      bestDistance = distance;
      bestMatch = key;
    }
  }

  return bestMatch ? searchCache.get(bestMatch) ?? null : null;
};

export const useSearch = (term: string) => {
  const [loading, setLoading] = useState(false);
  const [matchedResults, setMatchedResults] = useState<TypedItems[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [ringLoader, setRingLoader] = useState(false);
  const [resultsKey, setResultsKey] = useState(0);

  const dbRef = useRef<IDBPDatabase | null>(null);

  // Save to IndexedDB
  const saveToDB = async (query: string, results: TypedItems[]) => {
    if (!dbRef.current) return;

    try {
      const tx = dbRef.current.transaction("searchCache", "readwrite");
      const store = tx.objectStore("searchCache");
      const normalizedQuery = normalizeQuery(query);

      await store.put({
        query: normalizedQuery,
        results,
        timestamp: Date.now(),
      });

      // Ensure cache size limit
      const allKeys = await store.getAllKeys();
      if (allKeys.length > MAX_CACHE_SIZE) {
        const allEntries: CacheEntry[] = await store.getAll();
        const sortedEntries = allEntries.sort(
          (a, b) => a.timestamp - b.timestamp
        );
        const excess = sortedEntries.slice(
          0,
          allEntries.length - MAX_CACHE_SIZE
        );
        for (const entry of excess) {
          await store.delete(entry.query);
          searchCache.delete(entry.query);
        }
      }

      await tx.done;
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
        if (showLoading) {
          setLoading(true);
        } else {
          setRingLoader(true);
        }

        const encodedQuery = encodeURIComponent(trimmedQuery);
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/search?query=${encodedQuery}`,
          {},
          { signal: controller.signal }
        );

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
          console.error("Failed to fetch snippet:", err);
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
        const db = await initDB();
        dbRef.current = db;

        // Load cache from IndexedDB
        const tx = db.transaction("searchCache", "readonly");
        const store = tx.objectStore("searchCache");
        const allEntries: CacheEntry[] = await store.getAll();
        const now = Date.now();

        // Filter out expired entries and populate searchCache
        const validEntries = allEntries.filter(
          (entry) => now - entry.timestamp < CACHE_EXPIRY_MS
        );
        validEntries.forEach((entry) => {
          searchCache.set(entry.query, entry.results);
        });

        // Clean up expired entries
        if (allEntries.length !== validEntries.length) {
          const txClean = db.transaction("searchCache", "readwrite");
          const storeClean = txClean.objectStore("searchCache");
          for (const entry of allEntries) {
            if (now - entry.timestamp >= CACHE_EXPIRY_MS) {
              await storeClean.delete(entry.query);
            }
          }
          await txClean.done;
        }

        // Trim cache if over size limit
        if (validEntries.length > MAX_CACHE_SIZE) {
          const sortedEntries = validEntries.sort(
            (a, b) => a.timestamp - b.timestamp
          );
          const excess = sortedEntries.slice(
            0,
            validEntries.length - MAX_CACHE_SIZE
          );
          const txTrim = db.transaction("searchCache", "readwrite");
          const storeTrim = txTrim.objectStore("searchCache");
          for (const entry of excess) {
            await storeTrim.delete(entry.query);
            searchCache.delete(entry.query);
          }
          await txTrim.done;
        }
      } catch (error) {
        console.error("Failed to initialize IndexedDB:", error);
      }
    };

    init();

    return () => {
      if (dbRef.current) {
        dbRef.current.close();
        dbRef.current = null;
      }
    };
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
  };
};
