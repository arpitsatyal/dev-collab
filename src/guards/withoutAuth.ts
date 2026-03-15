import apiClient from "../lib/apiClient";
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from "next";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function withoutAuth<P extends Record<string, any>>(
  handler: (
    context: GetServerSidePropsContext
  ) => Promise<GetServerSidePropsResult<P>>
): GetServerSideProps<P> {
  return async (context) => {
    try {
      // Check session on NestJS side
      const cookie = context.req.headers.cookie;
      const response = await apiClient.get("/auth/me", {
        headers: { cookie: cookie || "" },
      });

      if (response.data) {
        return {
          redirect: {
            destination: "/dashboard",
            permanent: false,
          },
        };
      }
    } catch (error) {
      // Not authenticated, proceed to handler
    }

    return handler(context);
  };
}
