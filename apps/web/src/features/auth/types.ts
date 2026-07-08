export type AdminRole = "ADMIN";

export type AdminUser = {
  id: string;
  email: string;
  role: AdminRole;
};

export type AdminLoginInput = {
  email: string;
  password: string;
};

export type AdminAuthResponse = {
  user: AdminUser;
};

export type AuthSessionStatus =
  | "checking"
  | "authenticated"
  | "unauthenticated"
  | "error";
