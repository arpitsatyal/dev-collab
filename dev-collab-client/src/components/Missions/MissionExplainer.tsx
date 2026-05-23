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
        title: "Testing Coverage Audit",
        description: "Search for existing test assets and compile an audit document.",
        prompt:
          "Perform a semantic search across the workspace for any existing testing or QA snippets. Based on what you find, create a new documentation document titled 'Testing Coverage Audit' summarizing our current testing assets.",
      },
      {
        title: "Architecture Overview",
        description: "Summarize existing authentication snippets into a formal guide.",
        prompt:
          "Use semantic search to find all snippets related to authentication, JWT, and user login. Write and create a new documentation document called 'Auth Architecture' summarizing the overall flow.",
      },
    ],
    snippets: [
      {
        title: "Database Query Helper",
        description: "Analyze DB schema snippets and generate reusable query handlers.",
        prompt:
          "Search for existing Drizzle ORM schema snippets in this workspace. Generate and create a new TypeScript snippet containing 3 reusable query handlers demonstrating robust CRUD operations.",
      },
      {
        title: "Glassmorphism UI Component",
        description: "Create premium front-end components matching existing styles.",
        prompt:
          "Find any existing CSS or styling snippets using semantic search. Create a new React Component snippet that implements a gorgeous glassmorphism dashboard card based on those styles.",
      },
    ],
    planning: [
      {
        title: "Error Handling Refactor Plan",
        description: "Find related bugs and create a consolidated refactoring ticket.",
        prompt:
          "Search the workspace for any work items mentioning 'bug', 'error', or 'crash'. Create a new high-priority Work Item proposing a unified global error handling refactor based on those existing issues.",
      },
      {
        title: "Feature Integration Roadmap",
        description: "Formulate task list to track payment integration based on context.",
        prompt:
          "Search for snippets and docs related to 'payment processing' or 'checkout'. Create 3 new Work Items that represent the milestones for integrating the Stripe API based on our current context.",
      },
    ],
    complex: [
      {
        title: "State Migration E2E",
        description: "A master mission that audits state, documents it, codes it, and creates tasks.",
        prompt:
          "Find all snippets related to Redux. Create a 'State Migration' document outlining the transition to Zustand, generate a reusable Zustand store snippet, and create a Work Item to track the migration phase.",
      },
      {
        title: "Security Audit & Reusable Helper",
        description: "Audit security tokens, create helper, and document credentials guidelines.",
        prompt:
          "Perform a semantic search for authentication methods. Document our session security details in a new document, create a reusable JWT validation helper snippet, and create a critical work item to audit API token rotators.",
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
