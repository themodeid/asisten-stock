import { Request, Response, NextFunction } from "express";
import * as userService from "./user.service";
import { successResponse } from "../../utils/response";
import { AppError } from "../../utils/appError";

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await userService.getAllUsers();
    return successResponse(res, users, "Users retrieved successfully");
  } catch (error: any) {
    next(new AppError(error.message, 500));
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError("Invalid user ID", 400);

    const user = await userService.getUserById(id);
    if (!user) throw new AppError("User not found", 404);

    return successResponse(res, user, "User found");
  } catch (error: any) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError("Invalid user ID", 400);

    const updated = await userService.updateUserProfile(id, req.body);
    if (!updated) throw new AppError("User not found", 404);

    return successResponse(res, updated, "User profile updated");
  } catch (error: any) {
    next(error);
  }
};
