export type LoginType = "admin" | "gruppe";

export type StaffSession =
  | { loginType: "admin" }
  | { loginType: "gruppe"; groupId: string };
