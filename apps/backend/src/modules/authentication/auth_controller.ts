import { asyncHandler } from "../../utils/asynchandler.ts";
import type { Request,Response,NextFunction } from "express";
import type { SignUpSchema } from "./auth_schema.ts";

export const signUpUserWithEmailAndPassword = asyncHandler(async(req:Request,res:Response,next:NextFunction) =>{
    const data = req.body as SignUpSchema;    
    
});