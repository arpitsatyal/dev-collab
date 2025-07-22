import { User } from "@prisma/client";
import axios from "axios";
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from "next";

type WithSessionGuardResult<T> = GetServerSidePropsResult<T & { user: User }>;

export function withAuth<T>(
  getProps?: (
    context: GetServerSidePropsContext,
    user: User
  ) => Promise<WithSessionGuardResult<T>>
): GetServerSideProps<T & { user: User }> {
  return async (context) => {
    const { req } = context;

    try {
      const { data: user } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
        {
          headers: { Cookie: req.headers.cookie || "" },
          withCredentials: true,
        }
      );

      if (!user) {
        return {
          redirect: { destination: "/", permanent: false },
        };
      }

      if (getProps) {
        return await getProps(context, user);
      }

      return { props: { user } as T & { user: User } };
    } catch {
      return {
        redirect: { destination: "/", permanent: false },
      };
    }
  };
}
