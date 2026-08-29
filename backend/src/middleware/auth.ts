import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-12345";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    tenantId: string | null;
    branchId: string | null;
  };
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as AuthRequest).user = decoded;
    next();
  } catch (err) {
    console.error("JWT Verification failed:", err);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
