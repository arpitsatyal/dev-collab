import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import {
  NavLink,
  Text,
  Menu,
  Modal,
  TextInput,
  Button,
  Group,
} from "@mantine/core";
import { IconPlus, IconDotsVertical } from "@tabler/icons-react";
import { Project, Snippet } from "@prisma/client";
import { useAppDispatch } from "../../store/hooks";
import {
  useCreateSnippetMutation,
  useEditSnippetMutation,
} from "../../store/api/snippetApi";
import { languageMapper } from "../../utils/languageMapper";
import { addSnippet, updateSnippet } from "../../store/slices/snippetSlice";
import { notifications } from "@mantine/notifications";
import { syncMeiliSearch } from "../../utils/syncMeiliSearch";
import { SnippetsCreateData } from "../../pages/api/snippets";
import FileIcon from "../FileIcon";
import { useGetProjectByIdQuery } from "../../store/api/projectApi";
import { skipToken } from "@reduxjs/toolkit/query";

const SnippetList = ({
  snippets,
  isVisible,
}: {
  snippets: Snippet[];
  isVisible: boolean;
}) => {
  const router = useRouter();
  const pathParts = router.asPath.split("/");
  const snippetId = pathParts[4];

  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [modalMode, setModalMode] = useState<"rename" | "create">("rename");
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null);
  const [newSnippetTitle, setNewSnippetTitle] = useState("");
  const [nameError, setNameError] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const [createSnippet, { isLoading: isCreating }] = useCreateSnippetMutation();
  const [editSnippet, { isLoading: isEditing }] = useEditSnippetMutation();

  const isValidProjectId =
    typeof selectedSnippet?.projectId === "string" &&
    selectedSnippet?.projectId.trim() !== "";

  const { data: projectData } = useGetProjectByIdQuery(
    isValidProjectId ? selectedSnippet?.projectId : skipToken
  );

  useEffect(() => {
    if (pathParts[4] === "create") {
      setActiveItem("create");
    } else if (pathParts[3] === "snippets") {
      setActiveItem(snippetId);
    } else {
      setActiveItem(null);
    }
  }, [router.asPath, pathParts, snippetId]);

  const handleSnippetClick = (snippetId: string, path: string) => {
    setActiveItem(snippetId);
    router.push(path);
  };

  const openModal = (
    mode: "rename" | "create",
    snippet?: Snippet,
    event?: React.MouseEvent
  ) => {
    if (event) {
      event.stopPropagation(); // Prevent NavLink's onClick from firing
    }
    setModalMode(mode);
    setSelectedSnippet(snippet || null);
    setNewSnippetTitle(
      snippet ? `${snippet.title}.${snippet.extension ?? ""}` : ""
    );
    setNameError("");
    setDetectedLanguage(snippet ? snippet.language : null);
    setModalOpened(true);
  };

  const handleChangeSnippetName = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.value;
    setNewSnippetTitle(value);

    // Extract extension from input (e.g., "script.js" -> "js")
    const extensionMatch = value.match(/\.([a-zA-Z0-9]+)$/);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : "";
    const title = extensionMatch
      ? value.slice(0, -extensionMatch[0].length)
      : value;

    // Validate title (without extension)
    const isValid = /^[a-zA-Z0-9._-]+$/.test(title);

    if (!title || !isValid) {
      setNameError("File name cannot contain spaces or special characters.");
      setDetectedLanguage(null);
      return;
    } else {
      setNameError("");
    }

    // Detect language based on extension
    const language =
      languageMapper.find((lang) => lang.extension === extension)?.name || null;
    setDetectedLanguage(language);
  };

  const extractSnippetDetails = (input: string) => {
    const extensionMatch = input.match(/\.([a-zA-Z0-9]+)$/);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : "-";
    const title = extensionMatch
      ? input.slice(0, -extensionMatch[0].length)
      : input;
    const language =
      languageMapper.find((lang) => lang.extension === extension)?.name ||
      "plaintext";
    return { title, extension, language };
  };

  const handleModalSubmit = async () => {
    if (!newSnippetTitle.trim() || nameError) return;

    try {
      const { title, extension, language } =
        extractSnippetDetails(newSnippetTitle);

      if (modalMode === "rename" && selectedSnippet) {
        const data = await editSnippet({
          projectId: selectedSnippet.projectId,
          snippet: {
            ...selectedSnippet,
            title,
            language,
            extension,
          },
          snippetId: selectedSnippet.id,
        }).unwrap();

        dispatch(
          updateSnippet({
            projectId: selectedSnippet.projectId,
            snippetId: selectedSnippet.id,
            editedSnippet: data,
          })
        );

        notifications.show({
          title: "Done!",
          message: "Snippet updated successfully! 🌟",
        });

        await syncMeiliSearch({ ...data, project: projectData }, "snippet");
      } else if (modalMode === "create") {
        const projectId = router.query.projectId as string;

        const snippet: Omit<SnippetsCreateData, "authorId"> = {
          title,
          content: "",
          language,
          projectId,
          extension,
        };

        const data = await createSnippet({
          projectId,
          snippet,
        }).unwrap();

        dispatch(
          addSnippet({
            projectId,
            snippet: data,
          })
        );
        notifications.show({
          title: "Done!",
          message: "Snippet created successfully! 🌟",
        });

        await syncMeiliSearch({ ...data, project: projectData }, "snippet");
        router.push(`/projects/${projectId}/snippets/${data.id}`);
      }

      setModalOpened(false);
      setSelectedSnippet(null);
      setNewSnippetTitle("");
      setDetectedLanguage(null);
    } catch (error) {
      console.error(
        `Failed to ${modalMode === "rename" ? "rename" : "create"} snippet:`,
        error
      );
      notifications.show({
        title: "Whoops!",
        message: "Something went wrong.",
      });
    }
  };

  if (!isVisible) {
    return <></>;
  }

  return (
    <>
      <NavLink
        label="Create Snippet"
        onClick={(e) => openModal("create", undefined, e)}
        leftSection={<IconPlus size={16} />}
        active={activeItem === "create"}
      />

      {snippets.length ? (
        snippets.map((snippet) => (
          <NavLink
            key={snippet.id}
            label={
              <Text
                fz="sm"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={`${snippet.title}.${snippet.extension ?? ""}`}
              >
                {`${snippet.title}.${snippet.extension ?? ""}`}
              </Text>
            }
            leftSection={<FileIcon snippet={snippet} />}
            rightSection={
              <Menu withinPortal position="right-start" shadow="md">
                <Menu.Target>
                  <div onClick={(e) => e.stopPropagation()}>
                    <IconDotsVertical size={16} style={{ cursor: "pointer" }} />
                  </div>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item onClick={(e) => openModal("rename", snippet, e)}>
                    Rename
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            }
            active={activeItem === snippet.id}
            opened={activeItem === snippet.id}
            onClick={() =>
              handleSnippetClick(
                snippet.id,
                `/projects/${snippet.projectId}/snippets/${snippet.id}`
              )
            }
          />
        ))
      ) : (
        <></>
      )}

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={modalMode === "rename" ? "Rename Snippet" : "Create Snippet"}
        centered
      >
        <TextInput
          label="Snippet Name"
          value={newSnippetTitle}
          onChange={handleChangeSnippetName}
          placeholder="e.g., script.js or app.py"
          data-autofocus
          error={nameError}
        />
        <Text fz="sm" c="dimmed" mt="xs">
          Detected language: {detectedLanguage || "plaintext"}
        </Text>
        <Group align="right" mt="md">
          <Button variant="outline" onClick={() => setModalOpened(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleModalSubmit}
            disabled={!newSnippetTitle.trim() || !!nameError}
            loading={modalMode === "rename" ? isEditing : isCreating}
          >
            {modalMode === "rename" ? "Rename" : "Create"}
          </Button>
        </Group>
      </Modal>
    </>
  );
};

export default SnippetList;
