import { RequestHandler } from "express";
import { sendSuccess } from "../../utils/response";
import * as labelService from "./label.service";

export const create: RequestHandler = async (req, res) => {
  const label = await labelService.createLabel(req.params.boardId, req.body);
  sendSuccess(res, { label }, 201);
};

export const remove: RequestHandler = async (req, res) => {
  const result = await labelService.deleteLabel(
    req.params.boardId,
    req.params.labelId
  );
  sendSuccess(res, result);
};
