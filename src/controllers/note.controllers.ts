import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ProjectNote } from "../models/note.models";
import { CustomError } from "../utils/CustomError";
import { ResponseStatus } from "../utils/constants";
import { handleZodError } from "../utils/handleZodError";
import {
  validateNoteData,
  validateUpdateNoteData,
} from "../validations/notes.validations";
import { ApiResponse } from "../utils/ApiResponse";
import mongoose from "mongoose";
import { validateObjectId } from "../utils/helper";
import logger from "../utils/logger";

const createNote = asyncHandler(async (req: Request, res: Response) => {
  const { pid } = req.params;
  const { content, title } = handleZodError(validateNoteData(req.body));
  const userId = req.user._id;

  const existing = await ProjectNote.findOne({ title, project: pid });
  if (existing) {
    throw new CustomError(
      ResponseStatus.Conflict,
      `A note with the title '${title}' already exists in this project`,
    );
  }

  const note = await ProjectNote.create({
    project: pid,
    title,
    content,
    createdBy: userId,
  });

  logger.info(`Note "${title}" created by user ${userId} in project ${pid}`);

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        note,
        "Project note created successfully",
      ),
    );
});

const updateNote = asyncHandler(async (req: Request, res: Response) => {
  const { nid } = req.params;

  validateObjectId(nid, "Note");

  const { title, content } = handleZodError(validateUpdateNoteData(req.body));
  const updatePayload: Partial<{ title: string; content: string }> = {};

  if (title !== undefined) updatePayload.title = title;
  if (content !== undefined) updatePayload.content = content;

  if (Object.keys(updatePayload).length === 0) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "At least one field (title or content) must be provided to update",
    );
  }

  const updatedNote = await ProjectNote.findByIdAndUpdate(nid, updatePayload, {
    new: true,
  }).select("title content updatedAt");

  if (!updatedNote) {
    throw new CustomError(ResponseStatus.BadRequest, "Note does not exist");
  }

  logger.info(`Note ${nid} successfully updated`);

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        updatedNote,
        "Project note updated successfully",
      ),
    );
});

const deleteNote = asyncHandler(async (req: Request, res: Response) => {
  const { nid } = req.params;

  validateObjectId(nid, "Note");

  const deletedNote = await ProjectNote.findByIdAndDelete(nid);

  if (!deletedNote) {
    throw new CustomError(ResponseStatus.NotFound, "Note does not exist");
  }

  logger.info(`Note ${nid} deleted successfully`);

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        null,
        "Project note deleted successfully",
      ),
    );
});

const getNotes = asyncHandler(async (req: Request, res: Response) => {
  const { pid } = req.params;

  const notes = await ProjectNote.aggregate([
    {
      $match: { project: new mongoose.Types.ObjectId(pid) },
    },
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "createdByUser",
      },
    },
    { $unwind: "$createdByUser" },
    {
      $project: {
        title: 1,
        content: 1,
        createdBy: {
          username: "$createdByUser.username",
          email: "$createdByUser.email",
          fullName: "$createdByUser.fullName",
          avatar: "$createdByUser.avatar",
        },
      },
    },
  ]);

  logger.info(
    `Fetched ${notes.length} note(s) for project ${pid} by user ${req.user._id}`,
  );

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        notes,
        notes.length
          ? "Project notes fetched successfully"
          : "No project notes available",
      ),
    );
});

const getNoteById = asyncHandler(async (req: Request, res: Response) => {
  const { nid } = req.params;

  validateObjectId(nid, "Note");

  const note = await ProjectNote.findById(nid)
    .populate({
      path: "createdBy",
      select: "fullName avatar -_id",
    })
    .select("title content createdBy");

  if (!note) {
    throw new CustomError(ResponseStatus.NotFound, "Note does not exist");
  }

  logger.info(`Note ${nid} fetched successfully by user ${req.user._id}`);

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        note,
        "Project note fetched successfully",
      ),
    );
});

export { createNote, deleteNote, updateNote, getNotes, getNoteById };
