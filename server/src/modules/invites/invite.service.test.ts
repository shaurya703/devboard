import { prismaMock } from "../../test/prismaMock";
import * as inviteService from "./invite.service";
import { BoardRole } from "@devboard/shared";

const now = new Date("2026-01-01T00:00:00Z");

describe("inviteService.createInvite", () => {
  it("adds an existing user directly as a member", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u2",
      email: "bob@x.com",
      name: "Bob",
      passwordHash: "",
      createdAt: now,
      updatedAt: now,
    });
    prismaMock.boardMember.findUnique.mockResolvedValue(null); // not yet a member
    prismaMock.boardMember.create.mockResolvedValue({} as never);
    prismaMock.activity.create.mockResolvedValue({
      id: "a1",
      boardId: "b1",
      userId: "u1",
      type: "MEMBER_JOINED",
      metadata: {},
      createdAt: now,
      user: null,
    } as never);
    prismaMock.boardMember.findMany.mockResolvedValue([]);

    const result = await inviteService.createInvite(
      "b1",
      "u1",
      "bob@x.com",
      BoardRole.EDITOR
    );

    expect(result.type).toBe("member");
    expect(prismaMock.boardMember.create).toHaveBeenCalled();
  });

  it("creates a pending invite when no account exists", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.invite.updateMany.mockResolvedValue({ count: 0 } as never);
    prismaMock.invite.create.mockResolvedValue({
      id: "inv1",
      boardId: "b1",
      email: "new@x.com",
      role: "EDITOR",
      token: "tok",
      status: "PENDING",
      expiresAt: now,
      createdAt: now,
    } as never);
    prismaMock.activity.create.mockResolvedValue({
      id: "a1",
      boardId: "b1",
      userId: "u1",
      type: "MEMBER_INVITED",
      metadata: {},
      createdAt: now,
      user: null,
    } as never);

    const result = await inviteService.createInvite(
      "b1",
      "u1",
      "new@x.com",
      BoardRole.EDITOR
    );

    expect(result.type).toBe("invite");
  });

  it("rejects inviting someone who is already a member", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u2",
      email: "bob@x.com",
      name: "Bob",
      passwordHash: "",
      createdAt: now,
      updatedAt: now,
    });
    prismaMock.boardMember.findUnique.mockResolvedValue({
      id: "m2",
      boardId: "b1",
      userId: "u2",
      role: "EDITOR",
      createdAt: now,
    });

    await expect(
      inviteService.createInvite("b1", "u1", "bob@x.com", BoardRole.EDITOR)
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe("inviteService member management protects the owner", () => {
  it("won't change the owner's role", async () => {
    prismaMock.boardMember.findUnique.mockResolvedValue({
      id: "m1",
      boardId: "b1",
      userId: "u1",
      role: "OWNER",
      createdAt: now,
    });
    await expect(
      inviteService.updateMemberRole("b1", "u1", "u1", BoardRole.VIEWER)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("won't remove the owner", async () => {
    prismaMock.boardMember.findUnique.mockResolvedValue({
      id: "m1",
      boardId: "b1",
      userId: "u1",
      role: "OWNER",
      createdAt: now,
    });
    await expect(
      inviteService.removeMember("b1", "u1", "u1")
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
