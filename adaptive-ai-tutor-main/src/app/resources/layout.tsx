import { requireAdminRoute } from "@/lib/admin-route";

export default async function ResourcesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminRoute();
  return children;
}
