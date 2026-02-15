import NextAuth, { AuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "../../../lib/db/prisma";
import { getSecret } from "../../../utils/secrets";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: getSecret("GITHUB_CLIENT_ID"),
      clientSecret: getSecret("GITHUB_CLIENT_SECRET"),
    }),
    GoogleProvider({
      clientId: getSecret("GOOGLE_CLIENT_ID"),
      clientSecret: getSecret("GOOGLE_CLIENT_SECRET"),
    }),
  ],
  secret: getSecret("NEXTAUTH_SECRET"),
  callbacks: {
    async session({ session, user }) {
      if (session) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
