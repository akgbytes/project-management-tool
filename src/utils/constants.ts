export const ResponseStatus = {
  Success: 200,
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  Conflict: 409,
  InternalServerError: 500,
} as const;

export const ProjectStatus = {
  PLANNING: "planning",
  ONGOING: "ongoing",
  COMPLETED: "completed",
} as const;

export type ProjectStatusType =
  (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const UserRole = {
  Owner: "owner",
  ProjectManager: "project_manager",
  Member: "member",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export const allowedMimeTypes = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
