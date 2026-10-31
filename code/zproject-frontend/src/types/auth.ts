export interface CurrentUser {
  id: number;
  username: string;
  role: string;
  permissions: string[];
}

export interface Permission {
  id: number;
  code: string;
  description: string;
}

export interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

export interface RoleSummary {
  id: number;
  name: string;
}

export interface RoleCreate {
  name: string;
  permissionCodes: string[];
}



export interface UserSummary {
  id: number;
  username: string;
  isActive: boolean;
  role: RoleSummary;
}

export interface UserCreate {
  username: string;
  password: string;
  roleId: number;
}

export interface UserUpdate {
  roleId?: number;
  isActive?: boolean;
}