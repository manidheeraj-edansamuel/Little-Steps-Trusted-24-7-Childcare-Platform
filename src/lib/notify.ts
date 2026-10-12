import { prisma } from "./prisma";
import type { NotificationType } from "@prisma/client";

export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  body: string
) {
  return prisma.notification.create({
    data: { userId, type, title, body },
  });
}
