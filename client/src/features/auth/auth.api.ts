import {
  AuthResponse,
  LoginInput,
  RegisterInput,
  PublicUser,
} from "@devboard/shared";
import { api, unwrap } from "@/lib/api";

export const authApi = {
  register: (input: RegisterInput) =>
    unwrap<AuthResponse>(api.post("/auth/register", input)),

  login: (input: LoginInput) =>
    unwrap<AuthResponse>(api.post("/auth/login", input)),

  logout: () => api.post("/auth/logout"),

  me: () => unwrap<{ user: PublicUser }>(api.get("/auth/me")),
};
