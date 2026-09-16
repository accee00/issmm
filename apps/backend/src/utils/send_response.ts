import type { Response } from "express";
import { ApiError } from "./api_exception.ts";
import { ApiResponse } from "./api_response.ts";


export function sendResponse<T>(res:Response,apiResponse:ApiResponse<T>){
    return res.status(apiResponse.statusCode).json(apiResponse.toJSON())
}

export function sendError(res:Response,apiError:ApiError){
    return res.status(apiError.statusCode).json(apiError.toJSON())
}