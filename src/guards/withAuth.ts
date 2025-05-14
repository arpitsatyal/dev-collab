import { getServerSession } from "next-auth/next";
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from "next";
import { Session } from "next-auth";
import { authOptions } from "../pages/api/auth/[...nextauth]";

export function withAuth<P extends Record<string, any>>(
  handler: (
    context: GetServerSidePropsContext,
    session: Session
  ) => Promise<GetServerSidePropsResult<P>>
): GetServerSideProps<P> {
  return async (context) => {
    const session = await getServerSession(
      context.req,
      context.res,
      authOptions
    );

    if (!session || !session.user) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    return handler(context, session);
  };
}
