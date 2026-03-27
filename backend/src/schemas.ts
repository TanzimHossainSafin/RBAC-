import { z } from "zod";
import { ALL_PERMISSIONS } from "./permissions.js";

export const roleSchema = z.enum(["admin", "manager", "agent", "customer"]);
export const permissionSchema = z.enum(ALL_PERMISSIONS);
export const uuidSchema = z.string().uuid();

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export const signupSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email(),
  token: z.string().trim().min(1),
  newPassword: z.string().min(8),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8),
  role: roleSchema,
  managerId: uuidSchema.nullable().optional(),
  permissions: z.array(permissionSchema).optional(),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    role: roleSchema.optional(),
    managerId: uuidSchema.nullable().optional(),
  })
  .refine((value) => value.name !== undefined || value.role !== undefined || value.managerId !== undefined, {
    message: "At least one field must be provided",
  });

export const assignPermissionsSchema = z.object({
  permissions: z.array(permissionSchema),
});
