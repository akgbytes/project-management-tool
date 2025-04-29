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
