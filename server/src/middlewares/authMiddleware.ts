import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Request interface ko extend karte hain taaki req.user attach kar sakein
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Access denied! No token provided." });
    return;
  }

  const token = authHeader.split(" ")[1];
  const jwtSecret = process.env.JWT_SECRET || "fallbacksecret";

  try {
    const decoded = jwt.verify(token, jwtSecret) as {
      id: number;
      email: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token!" });
  }
};
