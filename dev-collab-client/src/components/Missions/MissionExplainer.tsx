import {
  Drawer,
  Text,
  Title,
  Badge,
  Group,
  Stack,
  Card,
  Tabs,
  ThemeIcon,
  Box,
  ScrollArea,
  Divider,
} from "@mantine/core";
import {
  IconCheck,
  IconBulb,
  IconBook,
  IconFileCode,
  IconTicket,
  IconBolt,
  IconArrowRight,
} from "@tabler/icons-react";
import { useState } from "react";

interface MissionExplainerProps {
  onSelectExample: (goal: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const MissionExplainer = ({
  onSelectExample,
  isOpen,
  onClose,
}: MissionExplainerProps) => {
  const [activeTab, setActiveTab] = useState<string | null>("documentation");

  const examples = {
    documentation: [
      {
        title: "Workspace Directory & API Audit",
        description: "Analyze the workspace's structure and write detailed technical guides.",
        prompt:
          "Analyze our workspace's routing and directory structure. Create a clear 'API Integration Guide' markdown document detailing how the main REST endpoints are configured and authenticated.",
      },
      {
        title: "Developer Onboarding Article",
        description: "Generate a comprehensive guide for new engineers joining the project.",
        prompt:
          "Audit the workspace codebase and create a new documentation document titled 'Developer Onboarding Guide' highlighting the modules structure, setting up environment variables, and starting the local server.",
      },
    ],
    snippets: [
      {
        title: "Database Drizzle ORM Snippets",
        description: "Analyze existing DB schema and generate reusable schema/query snippets.",
        prompt:
          "Find our Drizzle ORM schema configuration, read it, and generate a new code snippet containing 3 reusable TypeScript query handlers demonstrating robust CRUD operations with transactions.",
      },
      {
        title: "Glassmorphism UI Components",
        description: "Create premium front-end components matching high-end styling patterns.",
        prompt:
          "Generate a set of premium React Tailwind component snippets implementing a gorgeous glassmorphism dashboard card, including smooth micro-animations on hover.",
      },
    ],
    planning: [
      {
        title: "API Error Handling Refactor Plan",
        description: "Create a complete, prioritized pipeline task list with tickets.",
        prompt:
          "Draft a comprehensive refactoring plan for our backend API global error handling. Create 4 prioritized work items representing milestones: global filter setup, custom HTTP exceptions, class validator integration, and structured logging.",
      },
      {
        title: "Redux State Migration Roadmap",
        description: "Formulate task list to track client state management migration.",
        prompt:
          "Review our client app state requirements and create a set of high-priority work items (tickets) detailing a structured roadmap to migrate our remaining context-based state to Redux Toolkit slice architecture.",
      },
    ],
    complex: [
      {
        title: "End-to-End Module Delivery",
        description: "A master mission that audits a route, documents it, codes it, and creates tasks.",
        prompt:
          "Read our primary user registration route files, generate a comprehensive 'Auth Architecture' documentation file, write a reusable password hashing middleware helper snippet, and create 3 high-priority work items to track its deployment phase.",
      },
      {
        title: "Security Audit & Reusable Helper",
        description: "Audit security tokens, create helper, and document credentials guidelines.",
        prompt:
          "Perform a semantic search across our files for authentication methods. Document our session security details in a new document, create a reusable JWT validation helper snippet, and open a critical work item to audit API token rotators.",
      },
    ],
  };

  const handleExampleClick = (prompt: string) => {
    onSelectExample(prompt);
    onClose(); // Automatically close drawer on selection for seamless UX
  };

  return (
    <Drawer
      opened={isOpen}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon size="md" radius="md" color="indigo" variant="light">
            <IconBolt size={18} />
          </ThemeIcon>
          <Text fw={800} fz="lg" style={{ letterSpacing: "-0.3px" }}>
            Mission Control Guide
          </Text>
        </Group>
      }
      position="right"
      size="md"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="lg" py="xs">
        <Text size="sm" c="dimmed" lh={1.5}>
          Mission Control deploys specialized, autonomous AI agents to perform complex, multi-step engineering tasks inside your workspace.
        </Text>

        <Divider label="How It Works" labelPosition="left" />

        <Stack gap="sm">
          <Card withBorder p="sm" radius="md">
            <Group gap="xs" mb={4}>
              <ThemeIcon size="sm" color="blue" radius="xl" variant="light">
                <IconBulb size={12} />
              </ThemeIcon>
              <Text size="xs" fw={700} c="blue">
                1. DEFINE A GOAL
              </Text>
            </Group>
            <Text size="xs" c="dimmed" lh={1.4}>
              Specify what you want to achieve in plain English. The agent will read your goal and align it with the workspace.
            </Text>
          </Card>

          <Card withBorder p="sm" radius="md">
            <Group gap="xs" mb={4}>
              <ThemeIcon size="sm" color="violet" radius="xl" variant="light">
                <IconBolt size={12} />
              </ThemeIcon>
              <Text size="xs" fw={700} c="violet">
                2. AUTONOMOUS STEPS
              </Text>
            </Group>
            <Text size="xs" c="dimmed" lh={1.4}>
              The agent devises a custom plan, recursively using integrated tools (docs, snippets, work items, and semantic search) to achieve the goal.
            </Text>
          </Card>

          <Card withBorder p="sm" radius="md">
            <Group gap="xs" mb={4}>
              <ThemeIcon size="sm" color="teal" radius="xl" variant="light">
                <IconCheck size={12} />
              </ThemeIcon>
              <Text size="xs" fw={700} c="teal">
                3. INTERACTIVE REVIEW
              </Text>
            </Group>
            <Text size="xs" c="dimmed" lh={1.4}>
              For sensitive tool changes, the agent runs in a secure loop and pauses to request your authorization before execution.
            </Text>
          </Card>
        </Stack>

        <Divider label="Interactive Examples" labelPosition="left" />

        <Card withBorder radius="md" p="sm">
          <Text size="xs" fw={700} c="dimmed" mb="sm" style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
            💡 Select an Example to Adapt & Launch
          </Text>

          <Tabs value={activeTab} onChange={setActiveTab} variant="pills" radius="md">
            <Tabs.List mb="md">
              <Tabs.Tab value="documentation" leftSection={<IconBook size={14} />} color="blue">
                Docs
              </Tabs.Tab>
              <Tabs.Tab value="snippets" leftSection={<IconFileCode size={14} />} color="indigo">
                Snippets
              </Tabs.Tab>
              <Tabs.Tab value="planning" leftSection={<IconTicket size={14} />} color="violet">
                Planning
              </Tabs.Tab>
              <Tabs.Tab value="complex" leftSection={<IconBolt size={14} />} color="teal">
                Complex E2E
              </Tabs.Tab>
            </Tabs.List>

            {Object.entries(examples).map(([key, list]) => (
              <Tabs.Panel key={key} value={key}>
                <Stack gap="xs">
                  {list.map((ex, index) => (
                    <Card
                      key={index}
                      withBorder
                      p="sm"
                      radius="md"
                      style={{
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                      }}
                      onClick={() => handleExampleClick(ex.prompt)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "var(--mantine-shadow-xs)";
                        e.currentTarget.style.borderColor = "var(--mantine-color-indigo-4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.borderColor = "var(--mantine-color-gray-3)";
                      }}
                    >
                      <Group justify="space-between" align="center" mb={4}>
                        <Text size="xs" fw={700} c="bright">
                          {ex.title}
                        </Text>
                        <Badge size="xs" color="indigo" variant="light" rightSection={<IconArrowRight size={10} />}>
                          Use Prompt
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed" mb="xs" lh={1.3}>
                        {ex.description}
                      </Text>
                      <Box
                        p={8}
                        style={{
                          backgroundColor: "var(--mantine-color-body)",
                          border: "1px dashed var(--mantine-color-default-border)",
                          borderRadius: "6px",
                        }}
                      >
                        <Text size="xs" c="indigo" fs="italic" lh={1.3}>
                          &ldquo;{ex.prompt}&rdquo;
                        </Text>
                      </Box>
                    </Card>
                  ))}
                </Stack>
              </Tabs.Panel>
            ))}
          </Tabs>
        </Card>
      </Stack>
    </Drawer>
  );
};
