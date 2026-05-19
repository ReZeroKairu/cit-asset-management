import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const prisma = new PrismaClient();

export const auditMiddleware = (action: string, entityType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original res.json to intercept responses
    const originalJson = res.json;
    let responseData: any;
    let statusCode: number;

    res.json = function(data: any) {
      responseData = data;
      statusCode = res.statusCode;
      return originalJson.call(this, data);
    };

    // Handle the audit logging after response is sent
    res.on('finish', async () => {
      // Log successful responses (2xx status codes)
      if (statusCode >= 200 && statusCode < 300) {
        try {
          // Try to get user info from multiple sources
          let userId: number | null = null;
          
          // 1. Check if user is already attached to request (from previous middleware)
          if (req.user && req.user.userId) {
            userId = req.user.userId;
          }
          // 2. Check if we can extract from response (for login responses)
          else if (responseData && responseData.user && responseData.user.id) {
            userId = responseData.user.id;
          }
          // 3. Try to get from Authorization header (fallback)
          else {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (token) {
              try {
                const decoded = jwt.verify(token, config.jwtSecret) as any;
                userId = decoded.userId;
              } catch (jwtError) {
                // JWT decode failed, continue without user ID
              }
            }
          }

          const auditData: any = {
            action,
            description: `${action} ${entityType}${req.params.id ? ` #${req.params.id}` : ''}`,
            user_agent: req.headers['user-agent'] as string
          };

          // Only include user_id if we have a valid user
          if (userId) {
            auditData.user_id = userId;
          }

          // Capture lab_id for CIT Lab Users submissions
          if (entityType === "cit lab users log" && req.body && req.body.laboratory) {
            // Try to find lab_id from laboratory name
            try {
              const lab = await (prisma as any).laboratories.findFirst({
                where: { lab_name: req.body.laboratory },
                select: { lab_id: true }
              });
              if (lab) {
                auditData.lab_id = lab.lab_id;
              }
            } catch (labError) {
              // Could not find lab_id, continue without it
            }
          }

          await (prisma as any).audit_logs.create({
            data: auditData
          });
        } catch (error) {
          // Silent fail - don't log errors to avoid performance impact
        }
      }
    });

    next();
  };
};
