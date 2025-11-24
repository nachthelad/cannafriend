import { useState, useEffect } from "react";
import { useAuthUser } from "./use-auth-user";
import { plantsCol } from "@/lib/paths";
import { query, limit, onSnapshot } from "firebase/firestore";

export function useHasPlants() {
  const { user, isLoading: authLoading } = useAuthUser();
  const [hasPlants, setHasPlants] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setHasPlants(false);
      setIsLoading(false);
      return;
    }

    const q = query(plantsCol(user.uid), limit(1));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setHasPlants(!snapshot.empty);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error listening to plants:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  return { hasPlants, isLoading };
}
