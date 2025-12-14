import {type Request, type Response, type NextFunction} from  'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient(
    {log: ["error", "warn"]}
)

export const authenticate = (roles: string[] = []) => async(req: Request, res: Response, next: NextFunction) => {
    try{
        const token = req.cookies.access_token;
        if(!token) return res.status(401).json({
            message: "Not allowed, Please log in."
        });

        const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
        const user = await prisma.user.findUnique({
            where: {id: payload.userId}
        })

        if (!user || !user.isActive) return res.sendStatus(401);
        if (roles.length && !roles.includes(user.role))
            return res.sendStatus(403);

        req.user = user;
        next();

    }catch(err){
        res.status(500).json({
            message: "Something went wrong. Please try again later."
        })
    }
}