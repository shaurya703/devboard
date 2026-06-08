import { prismaMock } from "../../test/prismaMock";
import * as cardService from "./card.service";

const now = new Date("2026-01-01T00:00:00Z");

const cardRow = (overrides: Record<string, unknown> = {}) => ({
  id: "card1",
  columnId: "col1",
  title: "Task",
  description: null,
  dueDate: null,
  position: 1000,
  assigneeId: null,
  assignee: null,
  labels: [],
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

function mockActivity() {
  prismaMock.activity.create.mockResolvedValue({
    id: "a1",
    boardId: "b1",
    userId: "u1",
    type: "CARD_MOVED",
    metadata: {},
    createdAt: now,
    user: null,
  } as never);
}

describe("cardService.moveCard", () => {
  it("rejects a card that is not on the board (404)", async () => {
    prismaMock.card.findUnique.mockResolvedValue({
      ...cardRow(),
      column: { id: "col1", boardId: "OTHER_BOARD" },
    } as never);

    await expect(
      cardService.moveCard("b1", "card1", "u1", {
        toColumnId: "col2",
        position: 1500,
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("moves a card to a new column + position", async () => {
    prismaMock.card.findUnique.mockResolvedValue({
      ...cardRow(),
      column: { id: "col1", boardId: "b1" },
    } as never);
    // assertColumnInBoard target lookup
    prismaMock.column.findUnique.mockResolvedValue({
      id: "col2",
      boardId: "b1",
      title: "Doing",
      position: 2000,
      createdAt: now,
      updatedAt: now,
    } as never);
    prismaMock.card.update.mockResolvedValue(
      cardRow({ columnId: "col2", position: 1500 }) as never
    );
    mockActivity();

    const result = await cardService.moveCard("b1", "card1", "u1", {
      toColumnId: "col2",
      position: 1500,
    });

    expect(result.columnId).toBe("col2");
    expect(result.position).toBe(1500);
    expect(prismaMock.card.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { columnId: "col2", position: 1500 },
      })
    );
  });
});
