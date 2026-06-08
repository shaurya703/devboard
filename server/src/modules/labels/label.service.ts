import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { serializeLabel } from "../boards/serializers";

export async function createLabel(
  boardId: string,
  input: { name: string; color: string }
) {
  const label = await prisma.label.create({
    data: { boardId, name: input.name, color: input.color },
  });
  return serializeLabel(label);
}

export async function deleteLabel(boardId: string, labelId: string) {
  const label = await prisma.label.findUnique({ where: { id: labelId } });
  if (!label || label.boardId !== boardId) {
    throw ApiError.notFound("Label not found");
  }
  await prisma.label.delete({ where: { id: labelId } });
  return { id: labelId };
}
