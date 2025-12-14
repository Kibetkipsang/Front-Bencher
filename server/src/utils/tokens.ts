import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export const generateAccessToken = (userId: string, role: string) => {
    jwt.sign({userId, role}, ACCESS_SECRET, {expiresIn: "1hr"})
}

export const generateRefreshToken = (sessionId: string) => {
    jwt.sign({sessionId}, REFRESH_SECRET, {expiresIn: "7d"})
}