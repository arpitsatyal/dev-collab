import { useCallback } from "react";
import { notifications } from "@mantine/notifications";
import { useImportWorkspaceMutation, useGetRepoTreeQuery } from "../../store/api/workspaceApi";

export const useImportRepoTree = (repoUrl: string | null) => {
    return useGetRepoTreeQuery(repoUrl!, {
        skip: !repoUrl,
    });
};

export const useImportWorkspaceMutations = () => {
    const [importWorkspace, { isLoading: isImporting }] = useImportWorkspaceMutation();

    const handleImport = useCallback(
        async (url: string, selectedFiles: string[]) => {
            if (selectedFiles.length === 0) return null;
            try {
                const data = await importWorkspace({
                    url,
                    selectedFiles,
                }).unwrap();

                notifications.show({
                    title: "Success! 🚀",
                    message: `Imported ${data.stats.snippets} snippets and ${data.stats.docs} docs!`,
                    color: "green",
                });

                return data;
            } catch (error: any) {
                console.error("Import failed:", error);
                notifications.show({
                    title: "Import Failed",
                    message: error.data?.error || error.message || "Failed to import",
                    color: "red",
                });
                throw error;
            }
        },
        [importWorkspace]
    );

    return {
        isImporting,
        handleImport,
    };
};
