import { useRouter } from "next/router";
import React from "react";
import { getSingleQueryParam } from "../../utils/navigation/queryParams";
import { useSnippetExport } from "../../hooks/useSnippetExport";
import SnippetExportTrigger from "./SnippetExportTrigger";
import SnippetExportModal from "./SnippetExportModal";

interface ExportSnippetActionProps {
  code: string;
  language?: string;
}

const ExportSnippetAction = ({ code, language }: ExportSnippetActionProps) => {
  const router = useRouter();
  const workspaceId = getSingleQueryParam(router.query.workspaceId);

  const {
    opened,
    setOpened,
    fileName,
    setFileName,
    fileNameError,
    setFileNameError,
    isCreatingSnippet,
    isSuggestingFileName,
    saved,
    openPrompt,
    confirmExport,
    validateFileName,
  } = useSnippetExport({
    code,
    language,
    workspaceId,
  });

  return (
    <>
      <SnippetExportTrigger
        saved={saved}
        isLoading={isCreatingSnippet || isSuggestingFileName}
        onClick={openPrompt}
      />

      <SnippetExportModal
        opened={opened}
        onClose={() => setOpened(false)}
        fileName={fileName}
        onFileNameChange={(value) => {
          setFileName(value);
          setFileNameError(validateFileName(value));
        }}
        fileNameError={fileNameError}
        isSuggesting={isSuggestingFileName}
        isCreating={isCreatingSnippet}
        onConfirm={confirmExport}
      />
    </>
  );
};

export default ExportSnippetAction;
