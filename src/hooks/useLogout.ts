import axios from "axios";
import { useRouter } from "next/router";
import { useState } from "react";

export const useLogout = () => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const navigationPromise = router.push("/");

      const logoutPromise = axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,
        {
          withCredentials: true,
          timeout: 5000,
        }
      );

      await Promise.all([navigationPromise, logoutPromise]);
    } catch (error) {
      console.error("Logout failed:", error);

      try {
        await router.push("/");
      } catch (navError) {
        console.error("Navigation failed:", navError);
        window.location.href = "/";
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  return { handleLogout, isLoggingOut };
};
