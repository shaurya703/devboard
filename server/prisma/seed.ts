/**
 * Seed script — idempotent-ish demo data.
 * Run with: npm run db:seed   (server workspace)
 *
 * Creates two users, a shared board with columns/cards/labels, an assignee,
 * a board member, and a few activity entries so the UI has something to show.
 */
import { PrismaClient, BoardRole, ActivityType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "password123";

async function main() {
  console.log("🌱 Seeding DevBoard…");

  // Wipe in dependency order so re-running gives a clean slate.
  await prisma.activity.deleteMany();
  await prisma.cardLabel.deleteMany();
  await prisma.card.deleteMany();
  await prisma.column.deleteMany();
  await prisma.label.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.boardMember.deleteMany();
  await prisma.board.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const alice = await prisma.user.create({
    data: { email: "alice@devboard.dev", name: "Alice Owner", passwordHash },
  });
  const bob = await prisma.user.create({
    data: { email: "bob@devboard.dev", name: "Bob Editor", passwordHash },
  });

  const board = await prisma.board.create({
    data: {
      title: "DevBoard Roadmap",
      ownerId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: BoardRole.OWNER },
          { userId: bob.id, role: BoardRole.EDITOR },
        ],
      },
    },
  });

  const [bug, feature, urgent] = await Promise.all([
    prisma.label.create({
      data: { boardId: board.id, name: "Bug", color: "#ef4444" },
    }),
    prisma.label.create({
      data: { boardId: board.id, name: "Feature", color: "#3b82f6" },
    }),
    prisma.label.create({
      data: { boardId: board.id, name: "Urgent", color: "#f59e0b" },
    }),
  ]);

  const todo = await prisma.column.create({
    data: { boardId: board.id, title: "To Do", position: 1000 },
  });
  const doing = await prisma.column.create({
    data: { boardId: board.id, title: "In Progress", position: 2000 },
  });
  const done = await prisma.column.create({
    data: { boardId: board.id, title: "Done", position: 3000 },
  });

  const inAWeek = new Date();
  inAWeek.setDate(inAWeek.getDate() + 7);

  await prisma.card.create({
    data: {
      columnId: todo.id,
      title: "Set up CI pipeline",
      description: "GitHub Actions: lint, test, build on every PR.",
      position: 1000,
      assigneeId: bob.id,
      dueDate: inAWeek,
      labels: { create: [{ labelId: feature.id }] },
    },
  });
  await prisma.card.create({
    data: {
      columnId: todo.id,
      title: "Fix flaky refresh-token test",
      description: "Token rotation occasionally races under load.",
      position: 2000,
      labels: { create: [{ labelId: bug.id }, { labelId: urgent.id }] },
    },
  });
  await prisma.card.create({
    data: {
      columnId: doing.id,
      title: "Implement drag-and-drop board",
      description: "dnd-kit with optimistic reordering.",
      position: 1000,
      assigneeId: alice.id,
      labels: { create: [{ labelId: feature.id }] },
    },
  });
  await prisma.card.create({
    data: {
      columnId: done.id,
      title: "Design database schema",
      position: 1000,
      assigneeId: alice.id,
    },
  });

  await prisma.activity.createMany({
    data: [
      {
        boardId: board.id,
        userId: alice.id,
        type: ActivityType.BOARD_CREATED,
        metadata: { title: board.title },
      },
      {
        boardId: board.id,
        userId: alice.id,
        type: ActivityType.MEMBER_JOINED,
        metadata: { email: bob.email, role: BoardRole.EDITOR },
      },
    ],
  });

  console.log("✅ Seed complete.");
  console.log(`   Board: ${board.title} (${board.id})`);
  console.log(`   Login: alice@devboard.dev / ${DEMO_PASSWORD}`);
  console.log(`   Login: bob@devboard.dev   / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
