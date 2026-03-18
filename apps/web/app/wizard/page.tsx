"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WizardIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/wizard/step1");
  }, [router]);
  return null;
}
