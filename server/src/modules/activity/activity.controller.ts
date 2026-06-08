import { RequestHandler } from "express";
import { sendSuccess } from "../../utils/response";
import * as activityService from "./activity.service";

export const list: RequestHandler = async (req, res) => {
  const activities = await activityService.listActivity(req.params.boardId);
  sendSuccess(res, { activities });
};
