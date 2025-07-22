import type { NextPage } from "next";
import SignIn from "../components/SignIn/SignIn";

const Home: NextPage = () => {
  const handleGoogleSignIn = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  const handleGithubSignIn = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/github`;
  };

  return (
    <SignIn
      handleGithubSignIn={handleGithubSignIn}
      handleGoogleSignIn={handleGoogleSignIn}
    />
  );
};

export default Home;
