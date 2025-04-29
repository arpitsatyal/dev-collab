import { useEffect } from "react";

export function useSyncLoading(
  loading: boolean = false,
  setLoading: (loading: boolean) => void
) {
  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);
}
