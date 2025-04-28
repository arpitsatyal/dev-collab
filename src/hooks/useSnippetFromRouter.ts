import { useRouter } from "next/router";
import { getSingleQueryParam } from "../utils/getSingleQueryParam";
import { Snippet } from "@prisma/client";

export function useSnippetFromRouter(
  loadedSnippets: Record<string, Snippet[]>
) {
  const router = useRouter();

  const projectId = getSingleQueryParam(router.query.projectId);
  const snippetId = getSingleQueryParam(router.query.snippetId);

  if (!projectId || !snippetId) {
    return undefined;
  }

  return loadedSnippets[projectId]?.find((s) => s.id === snippetId);
}
