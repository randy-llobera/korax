import type { Metadata } from "next";

import { auth } from "@/auth";
import { HomepagePage } from "@/components/homepage/homepage-page";

export const metadata: Metadata = {
  title: "Korax | Stop Losing Your Developer Knowledge",
  description:
    "A climbing harness carries the essentials so you can focus on the climb. Korax keeps your developer knowledge within reach.",
};

export default async function HomePage() {
  const session = await auth();

  return <HomepagePage isSignedIn={Boolean(session?.user?.id)} />;
}
