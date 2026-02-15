import { prisma } from '@/lib/prisma';

export async function userCanAccessProject(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        { collaborators: { some: { userId } } },
      ],
    },
    select: { id: true },
  });

  return Boolean(project);
}

export async function userCanManageProject(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
    select: { id: true },
  });

  return Boolean(project);
}

