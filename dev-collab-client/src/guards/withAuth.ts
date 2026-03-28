import apiClient from "../lib/apiClient";
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from "next";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function withAuth<P extends Record<string, any>>(
  handler: (
    context: GetServerSidePropsContext,
    session: any
  ) => Promise<GetServerSidePropsResult<P>>
): GetServerSideProps<P> {
  return async (context) => {
    try {
      const cookie = context.req.headers.cookie;
      const response = await apiClient.get("/auth/me", {
        headers: { cookie: cookie || "" },
      });

      if (response.data) {
        const session = {
          user: response.data,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        return handler(context, session);
      }
    } catch (error) {
      // Not authenticated
    }

    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  };
}
