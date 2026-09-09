import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth";

export async function requireAdminRoute() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  return (await getUserSession())!;
}
