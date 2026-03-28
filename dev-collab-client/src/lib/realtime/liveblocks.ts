import { createClient } from "@liveblocks/client";
import apiClient from "../apiClient";

export const liveblocksClient = createClient({
  authEndpoint: async (room) => {
    const { data } = await apiClient.post("/collaboration/auth", { room });
    return data;
  },
});
