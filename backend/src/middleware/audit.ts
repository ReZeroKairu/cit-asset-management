import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const auditMiddleware = (action: string, entityType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // console.log(`🔍 Audit middleware called: ${action} ${entityType}`);
    
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
      // console.log(`✅ Response finished with status: ${statusCode}`);
      
      // Log successful responses (2xx status codes)
      if (statusCode >= 200 && statusCode < 300) {
        // console.log(`✅ Successful response, creating audit log`);
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
                const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
                userId = decoded.userId;
              } catch (jwtError) {
                console.log('❌ JWT decode failed:', jwtError);
              }
            }
          }

          const auditData: any = {
            action,
            description: `${action} ${entityType}${req.params.id ? ` #${req.params.id}` : ''}`
          };

          // Only include user_id if we have a valid user
          if (userId) {
            auditData.user_id = userId;
          }

          await (prisma as any).audit_logs.create({
            data: auditData
          });
        } catch (error) {
          console.error('❌ Audit logging failed:', error);
        }
      } else {
        console.log(`⚠️ Non-successful response (${statusCode}), skipping audit log`);
      }
    });

    next();
  };
};
