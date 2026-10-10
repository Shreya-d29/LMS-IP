import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { prisma } from "./db.js";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean }>;
};

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128)
});

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET must be configured with at least 32 characters.");
  return secret;
}

export const authRouter = Router();

authRouter.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: { role: { include: { permissions: true } } }
    });
    if (!user?.active || !(await bcrypt.compare(input.password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const permissions = Object.fromEntries(user.role.permissions.map((p) => [p.module, {
      view: p.canView, create: p.canCreate, edit: p.canEdit, delete: p.canDelete
    }]));
    const expiresIn: SignOptions["expiresIn"] = process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"] ?? "8h";
    const token = jwt.sign({ sub: user.id }, jwtSecret(), { expiresIn });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role.name, permissions }
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const value = req.header("authorization");
  if (!value?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  try {
    const payload = jwt.verify(value.slice(7), jwtSecret());
    if (typeof payload === "string" || !payload.sub) {
      res.status(401).json({ error: "Invalid authentication token." });
      return;
    }
    void prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: { include: { permissions: true } } }
    }).then((user) => {
      if (!user?.active) {
        res.status(401).json({ error: "Account is inactive." });
        return;
      }
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        permissions: Object.fromEntries(user.role.permissions.map((p) => [p.module, {
          view: p.canView, create: p.canCreate, edit: p.canEdit, delete: p.canDelete
        }]))
      };
      next();
    }).catch(next);
  } catch {
    res.status(401).json({ error: "Invalid or expired authentication token." });
  }
}

export function requirePermission(module: string, action: "view" | "create" | "edit" | "delete") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const permission = req.user?.permissions[module];
    if (req.user?.role === "SUPER_ADMIN" || permission?.[action]) {
      next();
      return;
    }
    res.status(403).json({ error: `You do not have ${action} permission for ${module}.` });
  };
}
