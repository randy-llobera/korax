import { auth } from "@/auth";

export const getSessionUserId = async () => {
  const session = await auth();

  return session?.user?.id ?? null;
};
