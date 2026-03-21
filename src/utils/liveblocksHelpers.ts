import apiClient from "../lib/apiClient";

const resolveUsers = async ({ userIds }: { userIds: string[] }) => {
  try {
    const searchParams = new URLSearchParams(
      userIds.map((userId) => ["userIds", userId])
    );
    const { data: users } = await apiClient.get(
      `/users/collaboration?${searchParams}`
    );
    return users ?? [];
  } catch (error) {
    console.error("Error resolving users:", error);
    return [];
  }
};

const fetchMentionSuggestions = async (text: string) => {
  try {
    const { data: userIds } = await apiClient.get(
      `/users/search/by-name?text=${encodeURIComponent(text)}`
    );

    return userIds;
  } catch (error) {
    console.error("Error resolving mention suggestions:", error);
    return [];
  }
};

export { resolveUsers, fetchMentionSuggestions };
