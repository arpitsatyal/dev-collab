
import {
    Modal,
    Button,
    Stack,
    Text,
    Group,
    Loader,
    ScrollArea,
    Divider,
    Paper,
} from "@mantine/core";
import { IconRobot, IconSparkles } from "@tabler/icons-react";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface ImplementationPlanModalProps {
    opened: boolean;
    onClose: () => void;
    taskId: string;
    taskTitle: string;
}

const ImplementationPlanModal = ({
    opened,
    onClose,
    taskId,
    taskTitle,
}: ImplementationPlanModalProps) => {
    const [plan, setPlan] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [draft, setDraft] = useState<string | null>(null);
    const [loadingDraft, setLoadingDraft] = useState(false);

    const MarkdownComponents: any = {
        code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const isBlock = !inline && (!!language || children?.toString().includes('\n'));

            // Multi-line code block
            if (isBlock) {
                return (
                    <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={language || 'text'}
                        PreTag="div"
                        showLineNumbers={false}
                        customStyle={{
                            margin: 0,
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            padding: '1rem',
                            background: '#1e1e1e',
                            width: 'fit-content',
                            maxWidth: '100%'
                        }}
                        codeTagProps={{
                            style: {
                                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                                fontSize: '0.9rem',
                            }
                        }}
                        {...props}
                    >
                        {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                );
            }

            // Inline code
            return (
                <code className={className} style={{
                    background: 'light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-5))',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.9em',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    color: 'light-dark(var(--mantine-color-red-7), var(--mantine-color-red-4))',
                }} {...props}>
                    {children}
                </code>
            );
        },

        // Wrap pre tags in a layout container to ensure separation and overflow handling
        pre: ({ children }: any) => {
            return (
                <div style={{
                    margin: '1.25rem 0',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    display: 'block',
                    width: '100%'
                }}>
                    <div style={{
                        overflowX: 'auto',
                        maxWidth: '100%'
                    }}>
                        {children}
                    </div>
                </div>
            );
        },

        p: ({ children }: any) => (
            <p style={{
                margin: '0.75rem 0',
                lineHeight: '1.6',
                wordBreak: 'normal',
                overflowWrap: 'break-word'
            }}>
                {children}
            </p>
        ),

        h1: ({ children }: any) => (
            <h1 style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                marginTop: '1.5rem',
                marginBottom: '1rem',
                lineHeight: '1.3',
            }}>
                {children}
            </h1>
        ),
        h2: ({ children }: any) => (
            <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                marginTop: '1.5rem',
                marginBottom: '0.75rem',
                lineHeight: '1.3',
            }}>
                {children}
            </h2>
        ),
        h3: ({ children }: any) => (
            <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                marginTop: '1.25rem',
                marginBottom: '0.5rem',
                lineHeight: '1.4',
            }}>
                {children}
            </h3>
        ),
        h4: ({ children }: any) => (
            <h4 style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                marginTop: '1rem',
                marginBottom: '0.5rem',
                lineHeight: '1.4',
            }}>
                {children}
            </h4>
        ),

        ul: ({ children }: any) => (
            <ul style={{
                margin: '0.5rem 0 0.5rem 1.5rem',
                paddingLeft: '0.5rem',
                lineHeight: '1.8'
            }}>
                {children}
            </ul>
        ),
        ol: ({ children }: any) => (
            <ol style={{
                margin: '0.5rem 0 0.5rem 1.5rem',
                paddingLeft: '0.5rem',
                lineHeight: '1.8'
            }}>
                {children}
            </ol>
        ),
        li: ({ children }: any) => (
            <li style={{
                marginBottom: '0.25rem',
                paddingLeft: '0.25rem'
            }}>
                {children}
            </li>
        ),

        blockquote: ({ children }: any) => (
            <blockquote style={{
                borderLeft: '4px solid var(--mantine-color-blue-6)',
                paddingLeft: '1rem',
                margin: '1rem 0',
                fontStyle: 'italic',
                color: 'light-dark(var(--mantine-color-gray-7), var(--mantine-color-gray-5))'
            }}>
                {children}
            </blockquote>
        ),

        table: ({ children }: any) => (
            <div style={{ overflowX: 'auto', margin: '1rem 0' }}>
                <table style={{
                    borderCollapse: 'collapse',
                    width: '100%',
                    minWidth: '400px',
                    fontSize: '0.9rem',
                    border: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))'
                }}>
                    {children}
                </table>
            </div>
        ),
        thead: ({ children }: any) => (
            <thead style={{
                backgroundColor: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-7))'
            }}>
                {children}
            </thead>
        ),
        th: ({ children }: any) => (
            <th style={{
                border: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
                padding: '10px 12px',
                textAlign: 'left',
                fontWeight: 700
            }}>
                {children}
            </th>
        ),
        td: ({ children }: any) => (
            <td style={{
                border: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
                padding: '8px 12px',
            }}>
                {children}
            </td>
        ),

        hr: () => (
            <hr style={{
                border: 'none',
                borderTop: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))',
                margin: '1.5rem 0'
            }} />
        ),

        // Link handler
        a: ({ href, children, ...props }: any) => (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    color: 'var(--mantine-color-blue-6)',
                    textDecoration: 'underline',
                    wordBreak: 'break-word'
                }}
                {...props}
            >
                {children}
            </a>
        ),

        // Strong/Bold handler
        strong: ({ children }: any) => (
            <strong style={{ fontWeight: 700 }}>
                {children}
            </strong>
        ),

        // Emphasis/Italic handler
        em: ({ children }: any) => (
            <em style={{ fontStyle: 'italic' }}>
                {children}
            </em>
        )
    };

    const handleGeneratePlan = async () => {
        setLoading(true);
        setDraft(null);
        try {
            const response = await fetch(`/api/ai/analyze-work-item?taskId=${taskId}`);
            const data = await response.json();
            setPlan(data.plan);
        } catch (error) {
            console.error("Failed to generate plan", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateDraft = async () => {
        setLoadingDraft(true);
        try {
            const response = await fetch(`/api/ai/draft-changes?taskId=${taskId}`);
            const data = await response.json();
            setDraft(data.draft);
        } catch (error) {
            console.error("Failed to generate draft", error);
        } finally {
            setLoadingDraft(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <IconRobot size={20} color="var(--mantine-color-blue-filled)" />
                    <Text fw={700}>AI Implementation Plan: {taskTitle}</Text>
                </Group>
            }
            size="xl"
            styles={{
                body: { overflowX: 'hidden', width: '100%' },
                content: { overflowX: 'hidden' }
            }}
        >
            <Stack gap="md" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
                {!plan && !loading && (
                    <Paper withBorder p="xl" radius="md" ta="center">
                        <Stack align="center" gap="md">
                            <IconSparkles size={48} color="var(--mantine-color-blue-filled)" opacity={0.5} />
                            <Text>Need a technical guide to solve this work item?</Text>
                            <Button leftSection={<IconRobot size={16} />} onClick={handleGeneratePlan}>
                                Generate Execution Plan
                            </Button>
                        </Stack>
                    </Paper>
                )}

                {loading && (
                    <Stack align="center" py="xl">
                        <Loader size="md" variant="dots" color="blue" />
                        <Text size="sm" c="dimmed">AI is analyzing the linked code context...</Text>
                    </Stack>
                )}

                {plan && (
                    <>
                        {loadingDraft ? (
                            <Stack align="center" py="xl">
                                <Loader size="md" variant="dots" color="blue" />
                                <Text size="sm" c="dimmed" fs="italic">AI is drafting your code changes...</Text>
                            </Stack>
                        ) : draft ? (
                            <Stack gap="md">
                                <Group justify="space-between" align="center">
                                    <Text fw={700} size="lg" c="blue">Draft Implementation</Text>
                                    <Group gap="xs">
                                        <Button variant="subtle" size="xs" onClick={() => setDraft(null)}>Back to Plan</Button>
                                    </Group>
                                </Group>
                                <Paper
                                    withBorder
                                    p="sm"
                                    radius="md"
                                    bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))"
                                >
                                    <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm]}>{draft}</ReactMarkdown>
                                </Paper>
                            </Stack>
                        ) : (
                            <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm]}>{plan}</ReactMarkdown>
                        )}

                        <Divider mt="xl" mb="md" />
                        <Group justify="right" wrap="wrap">
                            {!draft && !loadingDraft && (
                                <Button
                                    variant="gradient"
                                    gradient={{ from: 'blue', to: 'cyan' }}
                                    leftSection={<IconSparkles size={16} />}
                                    onClick={handleGenerateDraft}
                                >
                                    Draft Suggested Changes
                                </Button>
                            )}
                            <Button
                                variant="light"
                                onClick={() => { setPlan(null); setDraft(null); }}
                                disabled={loadingDraft}
                            >
                                Regenerate Plan
                            </Button>
                        </Group>
                    </>
                )}
            </Stack>
        </Modal>
    );
};

export default ImplementationPlanModal;
