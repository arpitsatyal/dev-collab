import BaseButton from "../shared/base/BaseButton";
import BaseInput from "../shared/base/BaseInput";
import BaseCard from "../shared/base/BaseCard";
import BaseBadge from "../shared/base/BaseBadge";
import BaseActionIcon from "../shared/base/BaseActionIcon";
import BaseCheckbox from "../shared/base/BaseCheckbox";
import classes from "./Workspace.module.css";
import { useForm } from "@mantine/form";
import { useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/router";
import { IconSearch, IconX } from "@tabler/icons-react";
import { useImportWorkspaceMutations, useImportRepoTree } from "../../hooks/mutations/useImportWorkspaceMutations";
import { Box, Divider, Group, ScrollArea, Stack, Text, Title } from "@mantine/core";

const MAX_FILES = 20;

const ImportWorkspaceForm = () => {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [search, setSearch] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [repoUrl, setRepoUrl] = useState<string | null>(null);

    const { isImporting, handleImport } = useImportWorkspaceMutations();
    const { data: treeData, isFetching: isFetchingTree, error: treeError } = useImportRepoTree(repoUrl);

    const form = useForm({
        initialValues: {
            url: "" },
        validate: {
            url: (value) =>
                /github\.com\/([^/]+)\/([^/]+)/.test(value) ? null : "Invalid GitHub repository URL" } });

    const handleFetchTree = (values: typeof form.values) => {
        setRepoUrl(values.url);
    };

    useEffect(() => {
        if (treeData?.files) {
            setStep(2);
        }
    }, [treeData]);

    useEffect(() => {
        if (treeError) {
            notifications.show({
                title: "Fetch Failed",
                message: (treeError as any).data?.error || "Failed to fetch repo structure",
                color: "red" });
            setRepoUrl(null);
        }
    }, [treeError]);

    const repoFiles = treeData?.files || [];
    const isLoading = isFetchingTree || isImporting;

    const onImport = async () => {
        try {
            const data = await handleImport(form.values.url, selectedFiles);
            if (data) {
                router.push(`/workspaces/${data.workspace.id}`);
            }
        } catch (error) {
            // Error handled in hook
        }
    };

    const toggleFile = (path: string) => {
        setSelectedFiles(current =>
            current.includes(path)
                ? current.filter(p => p !== path)
                : current.length < MAX_FILES
                    ? [...current, path]
                    : current
        );
    };

    const filteredFiles = repoFiles.filter(f =>
        f.path.toLowerCase().includes(search.toLowerCase())
    );

    if (step === 1) {
        return (
            <Box maw={{ base: "100%", sm: 600, md: 800 }} mx="auto" p={{ base: "sm", sm: "md" }}>
                <BaseCard className={classes.root}>
                    <Stack gap="md">
                        <Title order={4}>Import from GitHub</Title>
                        <Text size="sm" c="dimmed">
                            Enter a public GitHub repository URL to browse its files and select context to import.
                        </Text>
                        <form onSubmit={form.onSubmit(handleFetchTree)}>
                            <Stack gap="sm">
                                <BaseInput
                                    label="GitHub Repository URL"
                                    placeholder="https://github.com/owner/repo"
                                    {...form.getInputProps("url")}
                                    size="md"
                                    required
                                />
                                <BaseButton
                                    type="submit"
                                    size="md"
                                    variant="gradient"
                                    loading={isLoading}
                                    gradient={{ from: "blue", to: "cyan", deg: 90 }}
                                    mt="md"
                                >
                                    Fetch Files
                                </BaseButton>
                            </Stack>
                        </form>
                    </Stack>
                </BaseCard>
            </Box>
        );
    }

    return (
        <Box maw={{ base: "100%", sm: 600, md: 800 }} mx="auto" p={{ base: "sm", sm: "md" }}>
            <BaseCard className={classes.root}>
                <Stack gap="md">
                    <Group justify="space-between">
                        <Title order={4}>Select Files to Import</Title>
                        <BaseBadge size="lg" variant="light" color={selectedFiles.length === MAX_FILES ? "orange" : "blue"}>
                            {selectedFiles.length} / {MAX_FILES} Selected
                        </BaseBadge>
                    </Group>

                    <BaseInput
                        placeholder="Search files..."
                        leftSection={<IconSearch size={16} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        rightSection={
                            search && (
                                <BaseActionIcon variant="transparent" onClick={() => setSearch("")}>
                                    <IconX size={16} />
                                </BaseActionIcon>
                            )
                        }
                    />

                    <ScrollArea.Autosize mah={400} type="always">
                        <Stack gap="xs">
                            {filteredFiles.map((file) => (
                                <BaseCheckbox
                                    key={file.path}
                                    label={file.path}
                                    checked={selectedFiles.includes(file.path)}
                                    onChange={() => toggleFile(file.path)}
                                    disabled={!selectedFiles.includes(file.path) && selectedFiles.length >= MAX_FILES}
                                />
                            ))}
                            {filteredFiles.length === 0 && (
                                <Text c="dimmed" ta="center" py="xl">No files found</Text>
                            )}
                        </Stack>
                    </ScrollArea.Autosize>

                    <Divider />

                    <Group grow>
                        <BaseButton variant="outline" onClick={() => setStep(1)} disabled={isLoading}>
                            Back
                        </BaseButton>
                        <BaseButton
                            variant="gradient"
                            gradient={{ from: "blue", to: "cyan", deg: 90 }}
                            onClick={onImport}
                            loading={isLoading}
                            disabled={selectedFiles.length === 0}
                        >
                            Import Selected
                        </BaseButton>
                    </Group>
                </Stack>
            </BaseCard>
        </Box>
    );
};

export default ImportWorkspaceForm;
