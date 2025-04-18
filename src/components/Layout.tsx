import { AppShell, Burger } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import SideNav from "./SideNav";

export default function Layout({ children }: any) {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
      </AppShell.Header>

      <SideNav />
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
