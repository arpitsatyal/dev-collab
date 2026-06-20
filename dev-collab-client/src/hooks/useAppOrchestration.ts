import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setWorkspacesOpen } from "../store/slices/workspaceSlice";
import {
  useGetWorkspaceByIdQuery,
  useGetWorkspacesQuery,
} from "../store/api/workspaceApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { useWorkspaceCacheUpdater } from "./useWorkspaceCacheUpdater";
import { isValidParam } from "../utils/navigation/validators";

export const useAppOrchestration = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isNavigating, setIsNavigating] = useState(false);
  const { pageSize, skip } = useAppSelector((state) => state.workspace);
  const updateQueryData = useWorkspaceCacheUpdater();

  const { data, isLoading: isWorkspacesLoading } = useGetWorkspacesQuery({
    skip,
    limit: pageSize,
  });

  const loadedWorkspaces = data?.items;
  const workspaceId = router.query.workspaceId;
  const isWorkspaceReady = isValidParam(workspaceId);

  const isWorkspaceLoaded = loadedWorkspaces?.find(
    (loaded) => loaded.id === workspaceId,
  );

  const { data: workspaceData } = useGetWorkspaceByIdQuery(
    isWorkspaceReady && !isWorkspaceLoaded
      ? (workspaceId as string)
      : skipToken,
  );

  // Handle router events for loading state
  useEffect(() => {
    const handleRouteChangeStart = () => setIsNavigating(true);
    const handleRouteChangeComplete = () => setIsNavigating(false);
    const handleRouteChangeError = () => setIsNavigating(false);

    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);
    router.events.on("routeChangeError", handleRouteChangeError);

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
      router.events.off("routeChangeError", handleRouteChangeError);
    };
  }, [router]);

  // Handle workspace context synchronization
  useEffect(() => {
    if (isWorkspaceReady && workspaceId) {
      dispatch(setWorkspacesOpen(true));

      if (!isWorkspaceLoaded && workspaceData) {
        updateQueryData(workspaceId as string, workspaceData);
      }
    }
  }, [
    workspaceId,
    isWorkspaceReady,
    workspaceData,
    isWorkspaceLoaded,
    dispatch,
    updateQueryData,
  ]);

  return {
    isNavigating,
    isWorkspacesLoading,
    isWorkspaceReady,
    workspaceId,
    router,
  };
};
