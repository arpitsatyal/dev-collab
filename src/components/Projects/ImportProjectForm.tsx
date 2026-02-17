
import {
    Box,
    Button,
    Paper,
    Stack,
    TextInput,
    Title,
    Text,
    Checkbox,
    ScrollArea,
    Divider,
    Group,
    Badge,
    ActionIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/router";
import { IconSearch, IconX } from "@tabler/icons-react";
import classes from "./Project.module.css";

interface RepoFile {
    path: string;
    size: number;
}

const MAX_FILES = 20;

const ImportProjectForm = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const [repoFiles, setRepoFiles] = useState<RepoFile[]>([]);
    const [search, setSearch] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

    const form = useForm({
        initialValues: {
            url: "",
        },
        validate: {
            url: (value) =>
                /github\.com\/([^/]+)\/([^/]+)/.test(value) ? null : "Invalid GitHub repository URL",
        },
    });

    const handleFetchTree = async (values: typeof form.values) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/projects/import/tree?url=${encodeURIComponent(values.url)}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Failed to fetch repo structure");

            setRepoFiles(data.files || []);
            setStep(2);
        } catch (error: any) {
            notifications.show({
                title: "Fetch Failed",
                message: error.message,
                color: "red",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = async () => {
        if (selectedFiles.length === 0) return;
        setIsLoading(true);
        try {
            const response = await fetch("/api/projects/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: form.values.url,
                    selectedFiles: selectedFiles,
                }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Failed to import");

            notifications.show({
                title: "Success! 🚀",
                message: `Imported ${data.stats.snippets} snippets and ${data.stats.docs} docs!`,
                color: "green",
            });

            router.push(`/projects/${data.project.id}`);
        } catch (error: any) {
            notifications.show({
                title: "Import Failed",
                message: error.message,
                color: "red",
            });
        } finally {
            setIsLoading(false);
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
                <Paper shadow="md" p={{ base: "md", sm: "lg" }} radius="md" withBorder className={classes.root}>
                    <Stack gap="md">
                        <Title order={4}>Import from GitHub</Title>
                        <Text size="sm" c="dimmed">
                            Enter a public GitHub repository URL to browse its files and select context to import.
                        </Text>
                        <form onSubmit={form.onSubmit(handleFetchTree)}>
                            <Stack gap="sm">
                                <TextInput
                                    label="GitHub Repository URL"
                                    placeholder="https://github.com/owner/repo"
                                    {...form.getInputProps("url")}
                                    size="md"
                                    variant="filled"
                                    required
                                    styles={{
                                        label: { fontWeight: 500, marginBottom: "12px" },
                                        input: { borderRadius: "8px" },
                                    }}
                                />
                                <Button
                                    type="submit"
                                    size="md"
                                    variant="gradient"
                                    loading={isLoading}
                                    gradient={{ from: "blue", to: "cyan", deg: 90 }}
                                    mt="md"
                                    style={{ borderRadius: "8px" }}
                                >
                                    Fetch Files
                                </Button>
                            </Stack>
                        </form>
                    </Stack>
                </Paper>
            </Box>
        );
    }

    return (
        <Box maw={{ base: "100%", sm: 600, md: 800 }} mx="auto" p={{ base: "sm", sm: "md" }}>
            <Paper shadow="md" p={{ base: "md", sm: "lg" }} radius="md" withBorder className={classes.root}>
                <Stack gap="md">
                    <Group justify="space-between">
                        <Title order={4}>Select Files to Import</Title>
                        <Badge size="lg" variant="light" color={selectedFiles.length === MAX_FILES ? "orange" : "blue"}>
                            {selectedFiles.length} / {MAX_FILES} Selected
                        </Badge>
                    </Group>

                    <TextInput
                        placeholder="Search files..."
                        leftSection={<IconSearch size={16} />}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        rightSection={
                            search && (
                                <ActionIcon variant="transparent" onClick={() => setSearch("")}>
                                    <IconX size={16} />
                                </ActionIcon>
                            )
                        }
                    />

                    <ScrollArea.Autosize mah={400} type="always">
                        <Stack gap="xs">
                            {filteredFiles.map((file) => (
                                <Checkbox
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
                        <Button variant="outline" onClick={() => setStep(1)} disabled={isLoading}>
                            Back
                        </Button>
                        <Button
                            variant="gradient"
                            gradient={{ from: "blue", to: "cyan", deg: 90 }}
                            onClick={handleImport}
                            loading={isLoading}
                            disabled={selectedFiles.length === 0}
                        >
                            Import Selected
                        </Button>
                    </Group>
                </Stack>
            </Paper>
        </Box>
    );
};

export default ImportProjectForm;
