"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTE_JOURNAL } from "@/lib/routes";

export default function CalendarRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(ROUTE_JOURNAL);
  }, [router]);
  return null;
}
