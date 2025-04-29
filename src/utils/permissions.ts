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
  AddProjectManager: "add:project_manager",
  RemoveProjectManager: "remove:project_manager",
  AddMember: "add:member",
  RemoveMember: "remove:member",
} as const;

export const UserRolePermissions = {
  admin: [
    Permissions.CreateProject,
    Permissions.DeleteProject,
    Permissions.UpdateProject,
    Permissions.ViewProject,
    Permissions.AddProjectManager,
    Permissions.RemoveProjectManager,
    Permissions.CreateTask,
    Permissions.UpdateTask,
    Permissions.DeleteTask,
    Permissions.CreateSubtask,
    Permissions.UpdateSubtask,
    Permissions.DeleteSubtask,
    Permissions.AddMember,
    Permissions.RemoveMember,
  ],
  project_manager: [
    Permissions.ViewProject,
    Permissions.CreateTask,
    Permissions.UpdateTask,
    Permissions.DeleteTask,
    Permissions.CreateSubtask,
    Permissions.UpdateSubtask,
    Permissions.DeleteSubtask,
    Permissions.AddMember,
    Permissions.RemoveMember,
  ],
  member: [
    Permissions.ViewProject,
    Permissions.CreateSubtask,
    Permissions.UpdateSubtask,
    Permissions.DeleteSubtask,
  ],
};

export type UserRole = keyof typeof UserRolePermissions;

export type PermissionType = (typeof Permissions)[keyof typeof Permissions];

export const hasPermission = (
  role: UserRole,
  permission: PermissionType
): boolean => {
  return (UserRolePermissions[role] as PermissionType[]).includes(permission);
};
