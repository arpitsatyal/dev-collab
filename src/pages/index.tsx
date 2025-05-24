import type { NextPage } from "next";
import { signIn } from "next-auth/react";
import { withoutAuth } from "../guards/withoutAuth";
import SignIn from "../components/SignIn/SignIn";

const Home: NextPage = () => {
  const handleGithubSignIn = async () => {
    try {
      await signIn("github");
    } catch (error) {
      console.error(error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn("google");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SignIn
      handleGithubSignIn={handleGithubSignIn}
      handleGoogleSignIn={handleGoogleSignIn}
    />
  );
};

export const getServerSideProps = withoutAuth(async () => {
  return {
    props: {},
  };
});

export default Home;
