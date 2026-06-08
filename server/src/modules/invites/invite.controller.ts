import { RequestHandler } from "express";
import { sendSuccess } from "../../utils/response";
import * as inviteService from "./invite.service";

export const listMembers: RequestHandler = async (req, res) => {
  const members = await inviteService.listMembers(req.params.boardId);
  sendSuccess(res, { members });
};

export const listInvites: RequestHandler = async (req, res) => {
  const invites = await inviteService.listInvites(req.params.boardId);
  sendSuccess(res, { invites });
};

export const create: RequestHandler = async (req, res) => {
  const result = await inviteService.createInvite(
    req.params.boardId,
    req.user!.id,
    req.body.email,
    req.body.role
  );
  sendSuccess(res, result, 201);
};

export const accept: RequestHandler = async (req, res) => {
  const result = await inviteService.acceptInvite(
    req.params.token,
    req.user!.id
  );
  sendSuccess(res, result);
};

export const revoke: RequestHandler = async (req, res) => {
  const result = await inviteService.revokeInvite(
    req.params.boardId,
    req.params.inviteId
  );
  sendSuccess(res, result);
};

export const updateRole: RequestHandler = async (req, res) => {
  const members = await inviteService.updateMemberRole(
    req.params.boardId,
    req.params.userId,
    req.user!.id,
    req.body.role
  );
  sendSuccess(res, { members });
};

export const removeMember: RequestHandler = async (req, res) => {
  const members = await inviteService.removeMember(
    req.params.boardId,
    req.params.userId,
    req.user!.id
  );
  sendSuccess(res, { members });
};
