import { apiRequest } from "./api";
import type { User } from "../types/user";

export function listUsers() {
  return apiRequest<User[]>("/users");
}
