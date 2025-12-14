import { type Response } from "express";

const isDev = process.env.NODE_ENV === "development";

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string
) => {
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: isDev,
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isDev,
    sameSite: "lax",
    path: "/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token", { path: "/auth/refresh" });
};
