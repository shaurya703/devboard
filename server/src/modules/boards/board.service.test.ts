import { prismaMock } from "../../test/prismaMock";
import * as boardService from "./board.service";
import { BoardRole } from "@devboard/shared";

const now = new Date("2026-01-01T00:00:00Z");
const ownerUser = {
  id: "u1",
  email: "alice@x.com",
  name: "Alice",
  passwordHash: "",
  createdAt: now,
  updatedAt: now,
};

describe("boardService.createBoard", () => {
  it("creates a board with owner membership and default columns", async () => {
    prismaMock.board.create.mockResolvedValue({
      id: "b1",
      title: "My Board",
      ownerId: "u1",
      createdAt: now,
      updatedAt: now,
      columns: [
        { id: "c1", boardId: "b1", title: "To Do", position: 1000, cards: [] },
      ],
      labels: [],
      members: [
        {
          id: "m1",
          boardId: "b1",
          userId: "u1",
          role: "OWNER",
          createdAt: now,
          user: ownerUser,
        },
      ],
    } as never);
    prismaMock.activity.create.mockResolvedValue({
      id: "a1",
      boardId: "b1",
      userId: "u1",
      type: "BOARD_CREATED",
      metadata: {},
      createdAt: now,
      user: ownerUser,
    } as never);

    const result = await boardService.createBoard("u1", "My Board");

    expect(result.title).toBe("My Board");
    expect(result.role).toBe(BoardRole.OWNER);
    expect(result.columns).toHaveLength(1);
    // Owner membership + default columns requested in the create call.
    const createArg = prismaMock.board.create.mock.calls[0][0] as any;
    expect(createArg.data.members.create).toMatchObject({
      userId: "u1",
      role: BoardRole.OWNER,
    });
    expect(createArg.data.columns.create).toHaveLength(3);
  });
});

describe("boardService.listBoards", () => {
  it("maps memberships to summaries with role + member count", async () => {
    prismaMock.boardMember.findMany.mockResolvedValue([
      {
        id: "m1",
        boardId: "b1",
        userId: "u1",
        role: "EDITOR",
        createdAt: now,
        board: {
          id: "b1",
          title: "Shared",
          ownerId: "u2",
          createdAt: now,
          updatedAt: now,
          _count: { members: 2 },
        },
      },
    ] as never);

    const boards = await boardService.listBoards("u1");
    expect(boards).toEqual([
      expect.objectContaining({
        id: "b1",
        role: "EDITOR",
        memberCount: 2,
        ownerId: "u2",
      }),
    ]);
  });
});
