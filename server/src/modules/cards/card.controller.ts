import { RequestHandler } from "express";
import { sendSuccess } from "../../utils/response";
import * as cardService from "./card.service";

export const create: RequestHandler = async (req, res) => {
  const card = await cardService.createCard(
    req.params.boardId,
    req.params.columnId,
    req.user!.id,
    req.body
  );
  sendSuccess(res, { card }, 201);
};

export const update: RequestHandler = async (req, res) => {
  const card = await cardService.updateCard(
    req.params.boardId,
    req.params.cardId,
    req.user!.id,
    req.body
  );
  sendSuccess(res, { card });
};

export const move: RequestHandler = async (req, res) => {
  const card = await cardService.moveCard(
    req.params.boardId,
    req.params.cardId,
    req.user!.id,
    req.body
  );
  sendSuccess(res, { card });
};

export const remove: RequestHandler = async (req, res) => {
  const result = await cardService.deleteCard(
    req.params.boardId,
    req.params.cardId,
    req.user!.id
  );
  sendSuccess(res, result);
};
