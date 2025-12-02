import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { UserRole } from '../entities/User';

const authorize = (...allowedRoles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || req.user.role === undefined) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`,
            });
        }

        next();
    };
};

export default authorize;
