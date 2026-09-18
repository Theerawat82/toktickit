import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-development";

export const tokenFor = (id: number) => jwt.sign({ id }, JWT_SECRET);
export const bearer = (id: number) => `Bearer ${tokenFor(id)}`;

export const mockRequester = {
  id: 1,
  email: "requester@example.com",
  name: "Alice",
  role: "Requester",
  isActive: true,
  mustChangePassword: false,
};

export const prismaMockWithUser = (user: any = mockRequester, rest: Record<string, any> = {}) => ({
  user: { findUnique: async () => user },
  ...rest,
});