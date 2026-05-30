import { prisma } from "@/lib/db";

export async function isAdmin(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });
  if (u?.isAdmin) return true;
  // Fallback: first user is admin
  const first = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return first?.id === userId;
}
