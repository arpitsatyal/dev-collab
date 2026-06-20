import { useRouter } from "next/router";
import { useCallback, useMemo } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetDocsQuery } from "../store/api/docsApi";
import { getSingleQueryParam } from "../utils/navigation/queryParams";
import { isValidParam } from "../utils/navigation/validators";

export const useDocsSideNav = () => {
  const router = useRouter();

  const workspaceId = useMemo(
    () => getSingleQueryParam(router.query.workspaceId) || "unknown",
    [router.query.workspaceId],
  );

  const currentDocId = useMemo(
    () => getSingleQueryParam(router.query.docId) || "",
    [router.query.docId],
  );

  const isWorkspaceReady = useMemo(
    () => isValidParam(workspaceId),
    [workspaceId],
  );

  const { data: docs, isLoading } = useGetDocsQuery(
    isWorkspaceReady ? { workspaceId } : skipToken,
  );

  const handleDocClick = useCallback(
    (docId: string) => {
      router.push(
        {
          pathname: `/workspaces/${workspaceId}/docs`,
          query: { docId },
        },
        undefined,
        { shallow: true },
      );
    },
    [router, workspaceId],
  );

  return {
    docs,
    isLoading,
    isWorkspaceReady,
    currentDocId,
    handleDocClick,
  };
};
