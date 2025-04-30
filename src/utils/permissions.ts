import { UserRoleType } from "./constants";

export const Permissions = {
  CreateProject: "create:project",
  DeleteProject: "delete:project",
  UpdateProject: "update:project",
  ViewProject: "view:project",
  CreateTask: "create:task",
  UpdateTask: "update:task",
  DeleteTask: "delete:task",
  CreateSubtask: "create:subtask",
  UpdateSubtask: "update:subtask",
  DeleteSubtask: "delete:subtask",
  AddMember: "add:member",
  RemoveMember: "remove:member",
  ViewMembers: "view:members",
  UpdateRole: "update:role",
} as const;

export const PermissionDescriptions: Record<PermissionType, string> = {
  "create:project": "Only the project owner can create a project",
  "delete:project": "Only the project owner can delete the project",
  "update:project": "Only the project owner can update the project",
  "view:project": "Only team members can view the project",

  "create:task": "Only the owner or project manager can create tasks",
  "update:task": "Only the owner or project manager can update tasks",
  "delete:task": "Only the owner or project manager can delete tasks",

  "create:subtask": "Only project members can create subtasks",
  "update:subtask": "Only project members can update subtasks",
  "delete:subtask": "Only project members can delete subtasks",

  "add:member": "Only the owner can add members",
  "remove:member": "Only the owner can remove members",
  "view:members": "Only team members can view other team members",

  "update:role": "Only the project owner can update member roles",
};

export type PermissionType = (typeof Permissions)[keyof typeof Permissions];

export const UserRolePermissions: Record<UserRoleType, PermissionType[]> = {
  owner: [
    Permissions.CreateProject,
    Permissions.DeleteProject,
    Permissions.UpdateProject,
    Permissions.ViewProject,
    Permissions.CreateTask,
    Permissions.UpdateTask,
    Permissions.DeleteTask,
    Permissions.CreateSubtask,
    Permissions.UpdateSubtask,
    Permissions.DeleteSubtask,
    Permissions.AddMember,
    Permissions.RemoveMember,
    Permissions.ViewMembers,
    Permissions.UpdateRole,
  ],
  project_manager: [
    Permissions.ViewProject,
    Permissions.ViewMembers,
    Permissions.CreateTask,
    Permissions.UpdateTask,
    Permissions.DeleteTask,
    Permissions.CreateSubtask,
    Permissions.UpdateSubtask,
    Permissions.DeleteSubtask,
  ],
  member: [
    Permissions.ViewProject,
    Permissions.ViewMembers,
    Permissions.CreateSubtask,
    Permissions.UpdateSubtask,
    Permissions.DeleteSubtask,
  ],
};

export const hasPermission = (
  role: UserRoleType,
  permission: PermissionType
): boolean => {
  return UserRolePermissions[role].includes(permission);
};
