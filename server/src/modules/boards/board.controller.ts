import { RequestHandler } from "express";
import { sendSuccess } from "../../utils/response";
import * as boardService from "./board.service";

export const list: RequestHandler = async (req, res) => {
  const boards = await boardService.listBoards(req.user!.id);
  sendSuccess(res, { boards });
};

export const create: RequestHandler = async (req, res) => {
  const board = await boardService.createBoard(req.user!.id, req.body.title);
  sendSuccess(res, { board }, 201);
};

export const get: RequestHandler = async (req, res) => {
  const board = await boardService.getBoard(
    req.params.boardId,
    req.boardRole!
  );
  sendSuccess(res, { board });
};

export const update: RequestHandler = async (req, res) => {
  const board = await boardService.updateBoard(
    req.params.boardId,
    req.user!.id,
    req.boardRole!,
    req.body.title
  );
  sendSuccess(res, { board });
};

export const remove: RequestHandler = async (req, res) => {
  const result = await boardService.deleteBoard(req.params.boardId);
  sendSuccess(res, result);
};
