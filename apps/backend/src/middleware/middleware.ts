import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api_exception.ts";
import { verifyAccessToken, type AccessTokenPayload } from "../utils/jwt.ts";
import { Role } from "db/generated/enums.ts";


export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
   const authHeader = req.headers.authorization;

   if(!authHeader){
    throw ApiError.unauthorized("Authentication required.");
   }

   const [scheme, token]= authHeader.split(" ");

   if(scheme!=="Bearer" || !token || authHeader.split(" ").length!==2){
    throw ApiError.unauthorized("Invalid token format.")
   }
   
   req.user = verifyAccessToken(token);
   next();
} catch (error) {
    next(error);
  }
}

export function restrictedTo(...allowedRoles:Role[]){
  return (
    req:Request,
    _res:Response,
    next:NextFunction,
  )=>{
    const user = req.user;

    if (!user) {
      throw ApiError.unauthorized("Authentication required.");
    }
    
    if (!allowedRoles.includes(user.role as Role)) {
      throw ApiError.forbidden("Forbidden. Insufficient permissions.");
    }
    
    next();
  }
}