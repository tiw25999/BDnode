import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'user' | 'admin';
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // For testing, create mock user only for valid tokens
    if (process.env.NODE_ENV === 'test') {
      // Check if token is a valid user ID (starts with 'test-user-' or 'test-admin-')
      if (token.startsWith('test-user-') || token.startsWith('test-admin-')) {
        req.user = {
          id: token, // Use token as user ID for testing
          email: 'test@example.com',
          role: token.includes('admin') ? 'admin' : 'user'
        };
        next();
        return;
      } else {
        return res.status(401).json({ error: 'Access denied' });
      }
    }

    // Verify JWT token
    const secret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
    const decoded = jwt.verify(token, secret) as any;

    // Get user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Response | void => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // For testing, create mock user
      if (process.env.NODE_ENV === 'test') {
        req.user = {
          id: token, // Use token as user ID for testing
          email: 'test@example.com',
          role: token.includes('admin') ? 'admin' : 'user'
        };
      } else {
        const secret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
        const decoded = jwt.verify(token, secret) as any;
        const { data: user } = await supabase
          .from('users')
          .select('id, email, role')
          .eq('id', decoded.userId)
          .single();

        if (user) {
          req.user = user;
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
