import {
  BoardSummaryDTO,
  BoardDetailDTO,
  ColumnDTO,
  CardDTO,
  LabelDTO,
  BoardMemberDTO,
  ActivityDTO,
  InviteDTO,
  CreateCardInput,
  UpdateCardInput,
  MoveCardInput,
  CreateBoardInput,
  CreateColumnInput,
  CreateInviteInput,
  CreateLabelInput,
  BoardRole,
} from "@devboard/shared";
import { api, unwrap } from "@/lib/api";

export const boardsApi = {
  // Boards
  list: () => unwrap<{ boards: BoardSummaryDTO[] }>(api.get("/boards")),
  get: (id: string) =>
    unwrap<{ board: BoardDetailDTO }>(api.get(`/boards/${id}`)),
  create: (input: CreateBoardInput) =>
    unwrap<{ board: BoardDetailDTO }>(api.post("/boards", input)),
  update: (id: string, title: string) =>
    unwrap<{ board: BoardDetailDTO }>(api.patch(`/boards/${id}`, { title })),
  remove: (id: string) => unwrap<{ id: string }>(api.delete(`/boards/${id}`)),

  // Columns
  createColumn: (boardId: string, input: CreateColumnInput) =>
    unwrap<{ column: ColumnDTO }>(
      api.post(`/boards/${boardId}/columns`, input)
    ),
  updateColumn: (
    boardId: string,
    columnId: string,
    data: { title?: string; position?: number }
  ) =>
    unwrap<{ column: ColumnDTO }>(
      api.patch(`/boards/${boardId}/columns/${columnId}`, data)
    ),
  deleteColumn: (boardId: string, columnId: string) =>
    unwrap<{ id: string }>(
      api.delete(`/boards/${boardId}/columns/${columnId}`)
    ),

  // Cards
  createCard: (boardId: string, columnId: string, input: CreateCardInput) =>
    unwrap<{ card: CardDTO }>(
      api.post(`/boards/${boardId}/columns/${columnId}/cards`, input)
    ),
  updateCard: (boardId: string, cardId: string, input: UpdateCardInput) =>
    unwrap<{ card: CardDTO }>(
      api.patch(`/boards/${boardId}/cards/${cardId}`, input)
    ),
  moveCard: (boardId: string, cardId: string, input: MoveCardInput) =>
    unwrap<{ card: CardDTO }>(
      api.patch(`/boards/${boardId}/cards/${cardId}/move`, input)
    ),
  deleteCard: (boardId: string, cardId: string) =>
    unwrap<{ id: string }>(api.delete(`/boards/${boardId}/cards/${cardId}`)),

  // Labels
  createLabel: (boardId: string, input: CreateLabelInput) =>
    unwrap<{ label: LabelDTO }>(api.post(`/boards/${boardId}/labels`, input)),
  deleteLabel: (boardId: string, labelId: string) =>
    unwrap<{ id: string }>(api.delete(`/boards/${boardId}/labels/${labelId}`)),

  // Activity & members
  activity: (boardId: string) =>
    unwrap<{ activities: ActivityDTO[] }>(
      api.get(`/boards/${boardId}/activity`)
    ),
  members: (boardId: string) =>
    unwrap<{ members: BoardMemberDTO[] }>(
      api.get(`/boards/${boardId}/members`)
    ),

  // Sharing
  listInvites: (boardId: string) =>
    unwrap<{ invites: InviteDTO[] }>(api.get(`/boards/${boardId}/invites`)),
  invite: (boardId: string, input: CreateInviteInput) =>
    unwrap<
      | { type: "member"; members: BoardMemberDTO[] }
      | { type: "invite"; invite: InviteDTO }
    >(api.post(`/boards/${boardId}/invites`, input)),
  revokeInvite: (boardId: string, inviteId: string) =>
    unwrap<{ id: string }>(
      api.delete(`/boards/${boardId}/invites/${inviteId}`)
    ),
  updateMemberRole: (boardId: string, userId: string, role: BoardRole) =>
    unwrap<{ members: BoardMemberDTO[] }>(
      api.patch(`/boards/${boardId}/members/${userId}`, { role })
    ),
  removeMember: (boardId: string, userId: string) =>
    unwrap<{ members: BoardMemberDTO[] }>(
      api.delete(`/boards/${boardId}/members/${userId}`)
    ),
};
