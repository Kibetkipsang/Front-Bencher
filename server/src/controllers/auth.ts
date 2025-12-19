import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { hashPassword, verifyPassword } from "../utils/hash";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokens";
import { setAuthCookies, clearAuthCookies } from "../utils/cookies";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// signup
export const signup = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: "Email exists" });

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      profile: { create: {} },
    },
  });

  return res.status(201).json({ message: "Account created" });
};

// login
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive)
    return res.status(401).json({ message: "Invalid credentials" });

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid)
    return res.status(401).json({ message: "Invalid credentials" });

  const session = await prisma.authSession.create({
    data: {
      userId: user.id,
      refreshToken: crypto.randomUUID(),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      expiresAt: new Date(Date.now() + 7 * 86400000),
    },
  });

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(session.id);

  setAuthCookies(res, accessToken, refreshToken);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  res.json({ message: "Logged in" });
};

// refresh token
export const refresh = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refresh_token;
    if (!token) return res.sendStatus(401);

    const payload = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET!
    ) as any;

    const session = await prisma.authSession.findUnique({
      where: { id: payload.sessionId },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date())
      return res.sendStatus(401);

    const newAccessToken = generateAccessToken(
      session.user.id,
      session.user.role
    );

    setAuthCookies(res, newAccessToken, token);

    res.sendStatus(200);
  } catch {
    res.sendStatus(401);
  }
};

// logout
export const logout = async (req: Request, res: Response) => {
  const token = req.cookies.refresh_token;
  if (token) {
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET!
      ) as any;
      await prisma.authSession.delete({
        where: { id: payload.sessionId },
      });
    } catch {}
  }

  clearAuthCookies(res);
  res.sendStatus(204);
};
