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

const createNote = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { content } = handleZodError(validateNoteData(req.body));
  const userId = req.user._id;

  const note = await ProjectNote.create({
    project: projectId,
    content,
    createdBy: userId,
  });

  if (!note) {
    throw new CustomError(
      ResponseStatus.InternalServerError,
      "Note creation failed"
    );
  }

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        note,
        "Project note created successfully"
      )
    );
});

const updateNote = asyncHandler(async (req: Request, res: Response) => {
  const { noteId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(noteId)) {
    throw new CustomError(ResponseStatus.BadRequest, "Invalid note ID");
  }
  const { title, content } = handleZodError(validateUpdateNoteData(req.body));

  const updatePayload: Partial<{ title: string; content: string }> = {};

  if (title !== undefined) updatePayload.title = title;
  if (content !== undefined) updatePayload.content = content;

  const updatedNote = await ProjectNote.findByIdAndUpdate(
    {
      noteId,
    },
    updatePayload,
    { new: true }
  );

  if (!updatedNote) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "Error while updating the note"
    );
  }

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        updatedNote,
        "Project note updated successfully"
      )
    );
});

const deleteNote = asyncHandler(async (req: Request, res: Response) => {
  const { noteId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(noteId)) {
    throw new CustomError(ResponseStatus.BadRequest, "Invalid note ID");
  }

  await ProjectNote.findByIdAndDelete(noteId);
  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        {},
        "Project note deleted successfully"
      )
    );
});

const getNotes = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;

  const notes = await ProjectNote.aggregate([
    {
      $match: { project: new mongoose.Types.ObjectId(projectId) },
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
        username: "$createdByUser.username",
        email: "$createdByUser.email",
        fullName: "$createdByUser.fullName",
        avatar: "$createdByUser.avatar",
      },
    },
  ]);

  if (!notes.length) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "No project notes are available"
    );
  }

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        notes,
        "Project notes fetched successfully"
      )
    );
});

const getNoteById = asyncHandler(async (req: Request, res: Response) => {
  const { noteId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(noteId)) {
    throw new CustomError(ResponseStatus.BadRequest, "Invalid note ID");
  }

  const note = await ProjectNote.findById(noteId).populate({
    path: "createdBy",
    select: "username email fullName avatar",
  });
  if (!note) {
    throw new CustomError(ResponseStatus.BadRequest, "Note does note exist");
  }

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        note,
        "Project note fetched successfully"
      )
    );
});

export { createNote, deleteNote, updateNote, getNotes, getNoteById };
