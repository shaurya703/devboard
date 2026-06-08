import { BoardRole } from "@devboard/shared";

declare global {
  namespace Express {
    interface Request {
      /** Set by requireAuth from a verified access token. */
      user?: { id: string; email: string };
      /** Set by the boardRole middleware after an access check. */
      boardRole?: BoardRole;
    }
  }
}

export {};
