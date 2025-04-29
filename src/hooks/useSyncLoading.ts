import { useEffect } from "react";

export function useSyncLoading(
  loading: boolean,
  setLoading: (loading: boolean) => void
) {
  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);
}
