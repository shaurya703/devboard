import { RequestHandler } from "express";
import { sendSuccess } from "../../utils/response";
import { ApiError } from "../../utils/ApiError";
import {
  REFRESH_COOKIE,
  setRefreshCookie,
  clearRefreshCookie,
} from "../../lib/cookies";
import * as authService from "./auth.service";

export const register: RequestHandler = async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(
    req.body
  );
  setRefreshCookie(res, refreshToken);
  sendSuccess(res, { user, accessToken }, 201);
};

export const login: RequestHandler = async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  setRefreshCookie(res, refreshToken);
  sendSuccess(res, { user, accessToken });
};

export const refresh: RequestHandler = async (req, res) => {
  const presented = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!presented) throw ApiError.unauthorized("No refresh token provided");

  const { user, accessToken, refreshToken } =
    await authService.rotateRefreshToken(presented);
  setRefreshCookie(res, refreshToken);
  sendSuccess(res, { user, accessToken });
};

export const logout: RequestHandler = async (req, res) => {
  const presented = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  await authService.logout(presented);
  clearRefreshCookie(res);
  sendSuccess(res, { ok: true });
};

export const me: RequestHandler = async (req, res) => {
  const user = await authService.getCurrentUser(req.user!.id);
  sendSuccess(res, { user });
};
