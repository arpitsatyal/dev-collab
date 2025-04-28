import { User } from "@prisma/client";
import axios from "axios";
import { useEffect, useState } from "react";

export const useUser = (userId: string | null | undefined) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User>();

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/users?userId=${userId}`);

        setUser(data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { user, loading };
};
