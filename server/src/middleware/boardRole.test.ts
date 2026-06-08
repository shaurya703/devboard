import { prismaMock } from "../test/prismaMock";
import { requireBoardRole } from "./boardRole";
import { BoardRole } from "@devboard/shared";
import { Request, Response } from "express";

function makeReqRes(boardId: string, userId: string) {
  const req = {
    params: { boardId },
    user: { id: userId, email: "u@x.com" },
  } as unknown as Request;
  const res = {} as Response;
  const next = jest.fn();
  return { req, res, next };
}

describe("requireBoardRole", () => {
  it("returns 404 (not 403) when the user is not a member", async () => {
    prismaMock.boardMember.findUnique.mockResolvedValue(null);
    const { req, res, next } = makeReqRes("b1", "u1");

    await requireBoardRole(BoardRole.VIEWER)(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404 })
    );
  });

  it("returns 403 when the member's role is insufficient", async () => {
    prismaMock.boardMember.findUnique.mockResolvedValue({
      id: "m1",
      boardId: "b1",
      userId: "u1",
      role: "VIEWER",
      createdAt: new Date(),
    });
    const { req, res, next } = makeReqRes("b1", "u1");

    await requireBoardRole(BoardRole.EDITOR)(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403 })
    );
  });

  it("passes and attaches role when access is sufficient", async () => {
    prismaMock.boardMember.findUnique.mockResolvedValue({
      id: "m1",
      boardId: "b1",
      userId: "u1",
      role: "OWNER",
      createdAt: new Date(),
    });
    const { req, res, next } = makeReqRes("b1", "u1");

    await requireBoardRole(BoardRole.EDITOR)(req, res, next);

    expect(next).toHaveBeenCalledWith(); // no error
    expect(req.boardRole).toBe("OWNER");
  });
});
