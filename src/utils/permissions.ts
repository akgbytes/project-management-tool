import { UserRoleType } from "./constants";

export const Permissions = {
  CreateProject: "create:project",
  DeleteProject: "delete:project",
  UpdateProject: "update:project",
  ViewProject: "view:project",
  CreateNote: "create:note",
  DeleteNote: "delete:note",
  UpdateNote: "update:note",
  ViewNote: "view:note",
  CreateTask: "create:task",
  UpdateTask: "update:task",
  DeleteTask: "delete:task",
  ViewTask: "view:task",
  CreateSubtask: "create:subtask",
  UpdateSubtask: "update:subtask",
  DeleteSubtask: "delete:subtask",
  AddMember: "add:member",
  RemoveMember: "remove:member",
  ViewMembers: "view:members",
  UpdateRole: "update:role",
  AddAttachments: "add:attachments",
  RemoveAttachments: "remove:attachments",
} as const;

export const PermissionDescriptions: Record<PermissionType, string> = {
  "create:project": "Only the project owner can create a project",
  "delete:project": "Only the project owner can delete the project",
  "update:project": "Only the project owner can update the project",
  "view:project": "Only team members can view the project",

  "create:note": "Only team members can create the note",
  "delete:note": "Only team members can delete the note",
  "update:note": "Only team members can update the note",
  "view:note": "Only team members can view the notes",

  "create:task": "Only the owner or project manager can create tasks",
  "update:task": "Only the owner or project manager can update tasks",
  "delete:task": "Only the owner or project manager can delete tasks",
  "view:task": "Only team members can view the notes",

  "create:subtask": "Only project members can create subtasks",
  "update:subtask": "Only project members can update subtasks",
  "delete:subtask": "Only project members can delete subtasks",

  "add:member": "Only the owner can add members",
  "remove:member": "Only the owner can remove members",
  "view:members": "Only team members can view other team members",

  "add:attachments": "Only team members can add attachments",
  "remove:attachments": "Only team members can remove attachments",

  "update:role": "Only the project owner can update member roles",
};

export type PermissionType = (typeof Permissions)[keyof typeof Permissions];

export const UserRolePermissions: Record<UserRoleType, PermissionType[]> = {
  owner: [
    Permissions.CreateProject,
    Permissions.DeleteProject,
    Permissions.UpdateProject,
    Permissions.ViewProject,
    Permissions.CreateNote,
    Permissions.DeleteNote,
    Permissions.UpdateNote,
    Permissions.ViewNote,
    Permissions.CreateTask,
    Permissions.UpdateTask,
    Permissions.DeleteTask,
    Permissions.ViewTask,
    Permissions.CreateSubtask,
    Permissions.UpdateSubtask,
    Permissions.DeleteSubtask,
    Permissions.AddMember,
    Permissions.RemoveMember,
    Permissions.ViewMembers,
    Permissions.UpdateRole,
    Permissions.AddAttachments,
    Permissions.RemoveAttachments,
  ],
  project_manager: [
    Permissions.ViewProject,
    Permissions.ViewMembers,
    Permissions.CreateNote,
    Permissions.DeleteNote,
    Permissions.UpdateNote,
    Permissions.ViewNote,
    Permissions.CreateTask,
    Permissions.UpdateTask,
    Permissions.DeleteTask,
    Permissions.ViewTask,
    Permissions.CreateSubtask,
    Permissions.UpdateSubtask,
    Permissions.DeleteSubtask,
    Permissions.AddAttachments,
    Permissions.RemoveAttachments,
  ],
  member: [
    Permissions.ViewProject,
    Permissions.ViewMembers,
    Permissions.CreateNote,
    Permissions.DeleteNote,
    Permissions.UpdateNote,
    Permissions.ViewNote,
    Permissions.ViewTask,
    Permissions.CreateSubtask,
    Permissions.UpdateSubtask,
    Permissions.DeleteSubtask,
    Permissions.AddAttachments,
    Permissions.RemoveAttachments,
  ],
};

export const hasPermission = (
  role: UserRoleType,
  permission: PermissionType,
): boolean => {
  return UserRolePermissions[role].includes(permission);
};
