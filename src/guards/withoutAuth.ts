// lib/withoutAuth.ts
import { getServerSession } from "next-auth/next";
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from "next";
import { authOptions } from "../pages/api/auth/[...nextauth]";

export function withoutAuth<P extends Record<string, any>>(
  handler: (
    context: GetServerSidePropsContext
  ) => Promise<GetServerSidePropsResult<P>>
): GetServerSideProps<P> {
  return async (context) => {
    const session = await getServerSession(
      context.req,
      context.res,
      authOptions
    );

    if (session?.user) {
      return {
        redirect: {
          destination: "/dashboard",
          permanent: false,
        },
      };
    }

    return handler(context);
  };
}
