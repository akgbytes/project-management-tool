import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ProjectNote } from "../models/projectNote.models";
import { CustomError } from "../utils/CustomError";
import { ResponseStatus } from "../utils/constants";

const getNotes = asyncHandler(async (req: Request, res: Response) => {
  // get all notes
  // project id & user id
});

const getNoteById = asyncHandler(async (req: Request, res: Response) => {
  // get note by id
});

const createNote = asyncHandler(async (req: Request, res: Response) => {
  // create note
});

const updateNote = asyncHandler(async (req: Request, res: Response) => {
  // update note
});

const deleteNote = asyncHandler(async (req: Request, res: Response) => {
  // delete note
});

export { createNote, deleteNote, getNoteById, getNotes, updateNote };
