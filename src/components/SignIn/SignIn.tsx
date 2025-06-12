import { Button, Card, Container, Stack, Text, Title } from "@mantine/core";
import React from "react";
import DevCollabIcon from "../DevCollabIcon";
import { IconBrandGoogle, IconGitBranch } from "@tabler/icons-react";
import classes from "./SignIn.module.css";

interface SignInProps {
  handleGithubSignIn: () => void;
  handleGoogleSignIn: () => void;
}

const SignIn = ({ handleGithubSignIn, handleGoogleSignIn }: SignInProps) => {
  return (
    <Container
      fluid
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      p="md"
    >
      <Card
        shadow="sm"
        padding="xl"
        radius="md"
        style={{ maxWidth: 400, width: "100%" }}
      >
        <Stack align="center" gap="xl">
          <DevCollabIcon />

          <Title order={2} ta="center">
            Welcome to Dev-Collab
          </Title>
          <Text size="md" ta="center" className={classes.secondary}>
            Sign in to collaborate, share, and build amazing projects together.
          </Text>
          <Stack w="100%" gap="md">
            <Button
              onClick={handleGithubSignIn}
              leftSection={<IconGitBranch size={20} />}
              variant="filled"
              color="dark"
              radius="md"
              fullWidth
            >
              Sign in with GitHub
            </Button>
            <Button
              onClick={handleGoogleSignIn}
              leftSection={<IconBrandGoogle size={20} />}
              variant="outline"
              color="blue"
              radius="md"
              fullWidth
            >
              Sign in with Google
            </Button>
          </Stack>
          <Text size="sm" ta="center" className={classes.secondary}>
            Don&apos;t have an account? Sign up with one click above!
          </Text>
        </Stack>
      </Card>
    </Container>
  );
};

export default SignIn;
