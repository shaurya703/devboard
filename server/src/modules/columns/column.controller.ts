import { RequestHandler } from "express";
import { sendSuccess } from "../../utils/response";
import * as columnService from "./column.service";

export const create: RequestHandler = async (req, res) => {
  const column = await columnService.createColumn(
    req.params.boardId,
    req.user!.id,
    req.body.title
  );
  sendSuccess(res, { column }, 201);
};

export const update: RequestHandler = async (req, res) => {
  const column = await columnService.updateColumn(
    req.params.boardId,
    req.params.columnId,
    req.user!.id,
    req.body
  );
  sendSuccess(res, { column });
};

export const remove: RequestHandler = async (req, res) => {
  const result = await columnService.deleteColumn(
    req.params.boardId,
    req.params.columnId,
    req.user!.id
  );
  sendSuccess(res, result);
};
