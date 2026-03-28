import { useRouter } from "next/router";
import { getSingleQueryParam } from "../utils/getSingleQueryParam";
import { Snippet } from "../types";

export function useSnippetFromRouter(
  loadedSnippets: Record<string, Snippet[]>
) {
  const router = useRouter();

  const workspaceId = getSingleQueryParam(router.query.workspaceId);
  const snippetId = getSingleQueryParam(router.query.snippetId);

  if (!workspaceId || !snippetId) {
    return undefined;
  }

  return loadedSnippets[workspaceId]?.find((s) => s.id === snippetId);
}
