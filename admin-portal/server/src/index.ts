import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z, ZodError } from "zod";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { authRouter, requireAuth, requirePermission } from "./auth.js";
import { prisma } from "./db.js";

const app = express();
const port = Number(process.env.API_PORT ?? 4000);
type InputType = "string" | "number" | "boolean" | "date" | "json";
type InputField = { type: InputType; required?: boolean };
const inputFields: Record<string, Record<string, InputField>> = {
  students: { admissionNo: { type: "string", required: true }, firstName: { type: "string", required: true }, lastName: { type: "string", required: true }, email: { type: "string" }, phone: { type: "string" }, dateOfBirth: { type: "date" }, gender: { type: "string" }, address: { type: "string" }, photoUrl: { type: "string" }, guardianName: { type: "string" }, guardianPhone: { type: "string" }, guardianEmail: { type: "string" }, documents: { type: "json" }, classId: { type: "string" }, applicationId: { type: "string" } },
  teachers: { employeeNo: { type: "string", required: true }, firstName: { type: "string", required: true }, lastName: { type: "string", required: true }, email: { type: "string", required: true }, phone: { type: "string" }, photoUrl: { type: "string" }, address: { type: "string" }, qualifications: { type: "string" } },
  classes: { name: { type: "string", required: true }, grade: { type: "number", required: true }, capacity: { type: "number" }, academicYearId: { type: "string" }, teacherId: { type: "string" } },
  divisions: { name: { type: "string", required: true }, classId: { type: "string", required: true } },
  subjects: { name: { type: "string", required: true }, code: { type: "string", required: true } },
  "academic-years": { name: { type: "string", required: true }, startDate: { type: "date", required: true }, endDate: { type: "date", required: true }, active: { type: "boolean" } },
  terms: { name: { type: "string", required: true }, startDate: { type: "date", required: true }, endDate: { type: "date", required: true }, academicYearId: { type: "string", required: true } },
  timetable: { divisionId: { type: "string", required: true }, subjectId: { type: "string", required: true }, teacherId: { type: "string", required: true }, dayOfWeek: { type: "number", required: true }, startTime: { type: "string", required: true }, endTime: { type: "string", required: true }, room: { type: "string", required: true } },
  attendance: { studentId: { type: "string", required: true }, date: { type: "date", required: true }, status: { type: "string", required: true }, note: { type: "string" } },
  "teacher-attendance": { teacherId: { type: "string", required: true }, date: { type: "date", required: true }, status: { type: "string", required: true }, note: { type: "string" } },
  leaves: { personType: { type: "string", required: true }, personId: { type: "string", required: true }, startDate: { type: "date", required: true }, endDate: { type: "date", required: true }, reason: { type: "string", required: true }, status: { type: "string" } },
  applications: { referenceNo: { type: "string", required: true }, firstName: { type: "string", required: true }, lastName: { type: "string", required: true }, dateOfBirth: { type: "date" }, guardianName: { type: "string", required: true }, guardianPhone: { type: "string", required: true }, guardianEmail: { type: "string" }, requestedClassId: { type: "string" }, status: { type: "string" }, documents: { type: "json" } },
  exams: { name: { type: "string", required: true }, term: { type: "string", required: true }, date: { type: "date" }, maxMarks: { type: "number" }, subjectId: { type: "string", required: true } },
  marks: { studentId: { type: "string", required: true }, examId: { type: "string", required: true }, score: { type: "number", required: true }, grade: { type: "string" } },
  "fee-structures": { name: { type: "string", required: true }, amount: { type: "number", required: true }, dueDate: { type: "date" }, classId: { type: "string" } },
  invoices: { invoiceNo: { type: "string", required: true }, studentId: { type: "string", required: true }, feeStructureId: { type: "string", required: true }, amount: { type: "number", required: true }, paidAmount: { type: "number" }, dueDate: { type: "date" }, status: { type: "string" }, scholarship: { type: "string" } },
  payments: { receiptNo: { type: "string", required: true }, invoiceId: { type: "string", required: true }, amount: { type: "number", required: true }, method: { type: "string", required: true } },
  events: { title: { type: "string", required: true }, description: { type: "string" }, startAt: { type: "date", required: true }, endAt: { type: "date" }, location: { type: "string" } },
  announcements: { title: { type: "string", required: true }, body: { type: "string", required: true }, audience: { type: "string" }, target: { type: "string" }, published: { type: "boolean" } },
  users: { name: { type: "string", required: true }, email: { type: "string", required: true }, password: { type: "string", required: true }, roleId: { type: "string", required: true }, active: { type: "boolean" } },
  permissions: { roleId: { type: "string", required: true }, module: { type: "string", required: true }, canView: { type: "boolean" }, canCreate: { type: "boolean" }, canEdit: { type: "boolean" }, canDelete: { type: "boolean" } },
  settings: { key: { type: "string", required: true }, value: { type: "json", required: true } }
};

function parseResourceBody(resource: string, body: unknown, partial = false): Record<string, unknown> {
  const fields = inputFields[resource];
  if (!fields) throw new ZodError([{ code: "custom", path: ["resource"], message: "Unknown resource." }]);
  const shape: Record<string, z.ZodType> = {};
  for (const [key, field] of Object.entries(fields)) {
    let schema: z.ZodType;
    switch (field.type) {
      case "number":
        schema = z.union([z.number(), z.string().regex(/^-?\d+(\.\d+)?$/).transform(Number)]).refine(Number.isFinite, "Must be a valid number.");
        break;
      case "boolean":
        schema = z.union([z.boolean(), z.enum(["true", "false", "1", "0"]).transform((value) => value === "true" || value === "1")]);
        break;
      case "date":
        schema = z.string().min(1).refine((value) => Number.isFinite(new Date(value).getTime()), "Must be a valid date.").transform((value) => new Date(value));
        break;
      case "json":
        schema = z.unknown();
        break;
      default:
        schema = z.string().max(2000);
    }
    if (["status"].includes(key) && resource === "attendance") schema = z.enum(["PRESENT", "ABSENT", "LATE", "LEAVE"]);
    if (["status"].includes(key) && resource === "teacher-attendance") schema = z.enum(["PRESENT", "ABSENT", "LATE", "LEAVE"]);
    if (resource === "applications" && key === "status") schema = z.enum(["APPLIED", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "ENROLLED"]);
    if (resource === "invoices" && key === "status") schema = z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE"]);
    if (resource === "announcements" && key === "audience") schema = z.enum(["ALL", "ROLE", "CLASS"]);
    if (resource === "leaves" && key === "personType") schema = z.enum(["STUDENT", "TEACHER"]);
    if (resource === "leaves" && key === "status") schema = z.enum(["PENDING", "APPROVED", "REJECTED"]);
    if (resource === "payments" && key === "method") schema = z.enum(["CASH", "CARD", "BANK_TRANSFER", "UPI"]);
    if (resource === "timetable" && (key === "startTime" || key === "endTime")) schema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a 24-hour time such as 09:30.");
    if (key === "email" || key === "guardianEmail") schema = z.string().email().max(254);
    if (key === "photoUrl") schema = z.string().url();
    shape[key] = partial || !field.required ? schema.optional() : schema;
  }
  return z.object(shape).strict().parse(body);
}

async function assertNoTimetableConflict(data: Record<string, unknown>, excludeId?: string): Promise<void> {
  const startTime = String(data.startTime ?? "");
  const endTime = String(data.endTime ?? "");
  if (startTime >= endTime) throw new ZodError([{ code: "custom", path: ["endTime"], message: "End time must be later than start time." }]);
  const teacherId = String(data.teacherId ?? "");
  const room = String(data.room ?? "");
  const dayOfWeek = Number(data.dayOfWeek);
  const existing = await prisma.timetableEntry.findMany({
    where: { dayOfWeek, ...(excludeId ? { id: { not: excludeId } } : {}), OR: [{ teacherId }, { room }] }
  });
  const conflict = existing.find((entry) => entry.startTime < endTime && startTime < entry.endTime);
  if (conflict) {
    const reason = conflict.teacherId === teacherId ? "Teacher is already scheduled during this time." : `Room ${room} is already booked during this time.`;
    throw new ZodError([{ code: "custom", path: ["startTime"], message: reason }]);
  }
}

app.use(helmet());
const configuredOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
const allowedOrigins = new Set([
  configuredOrigin,
  configuredOrigin.replace("://localhost", "://127.0.0.1"),
  configuredOrigin.replace("://127.0.0.1", "://localhost")
]);
app.use(cors({ origin: (origin, callback) => {
  if (!origin || allowedOrigins.has(origin)) { callback(null, true); return; }
  callback(new Error("This origin is not allowed."));
} }));
app.use(express.json({ limit: "1mb" }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }), authRouter);
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", requireAuth);

app.get("/api/dashboard", requirePermission("dashboard", "view"), async (_req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const since = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const [students, teachers, present, invoices, pending, recentEvents, recentApplications, latestPayments, allStudents, monthlyPayments, monthlyAttendance, marks] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.studentAttendance.count({ where: { date: today, status: "PRESENT" } }),
      prisma.invoice.aggregate({ _sum: { amount: true, paidAmount: true } }),
      prisma.invoice.count({ where: { status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } } }),
      prisma.event.findMany({ where: { startAt: { gte: today } }, orderBy: { startAt: "asc" }, take: 4 }),
      prisma.application.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.payment.findMany({ orderBy: { paidAt: "desc" }, take: 5, include: { invoice: { include: { student: true } } } }),
      prisma.student.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.payment.findMany({ where: { paidAt: { gte: since } }, select: { amount: true, paidAt: true } }),
      prisma.studentAttendance.findMany({ where: { date: { gte: since, lte: today } }, select: { date: true, status: true } }),
      prisma.mark.findMany({ select: { score: true, exam: { select: { name: true, maxMarks: true } } } })
    ]);
    const monthKeys = Array.from({ length: 6 }, (_, index) => new Date(today.getFullYear(), today.getMonth() - 5 + index, 1));
    const monthLabel = (date: Date) => date.toLocaleDateString("en-US", { month: "short" });
    const analytics = monthKeys.map((month) => {
      const year = month.getFullYear();
      const monthIndex = month.getMonth();
      const byMonth = (date: Date) => date.getFullYear() === year && date.getMonth() === monthIndex;
      const attendance = monthlyAttendance.filter((row) => byMonth(row.date));
      const collection = monthlyPayments.filter((row) => byMonth(row.paidAt)).reduce((sum, row) => sum + Number(row.amount), 0);
      const exams = marks.filter((row) => row.exam.name.length > 0);
      const average = exams.length ? Math.round(exams.reduce((sum, row) => sum + (row.score / row.exam.maxMarks) * 100, 0) / exams.length) : 0;
      return {
        month: monthLabel(month),
        enrollment: allStudents.filter((row) => byMonth(row.createdAt)).length,
        attendance: attendance.length ? Math.round(attendance.filter((row) => row.status === "PRESENT").length / attendance.length * 100) : 0,
        collection,
        performance: average
      };
    });
    res.json({
      students, teachers, attendanceToday: present,
      attendanceRate: students ? Math.round((present / students) * 100) : 0,
      feesCollected: Number(invoices._sum.paidAmount ?? 0),
      feesBilled: Number(invoices._sum.amount ?? 0),
      invoicesPending: pending,
      analytics,
      events: recentEvents,
      applications: recentApplications,
      payments: latestPayments
    });
  } catch (error) { next(error); }
});

app.get("/api/students", requirePermission("students", "view"), async (req, res, next) => {
  try {
    const search = String(req.query.search ?? "").trim();
    const students = await prisma.student.findMany({
      where: search ? { OR: [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { admissionNo: { contains: search, mode: "insensitive" } }
      ] } : undefined,
      include: { class: true }, orderBy: { createdAt: "desc" }
    });
    res.json(students);
  } catch (error) { next(error); }
});
app.post("/api/students", requirePermission("students", "create"), async (req, res, next) => {
  try {
    const body = parseResourceBody("students", req.body) as Prisma.StudentUncheckedCreateInput;
    const student = await prisma.student.create({ data: body });
    res.status(201).json(student);
  } catch (error) { next(error); }
});
app.patch("/api/students/:id", requirePermission("students", "edit"), async (req, res, next) => {
  try {
    const body = parseResourceBody("students", req.body, true) as Prisma.StudentUpdateInput;
    const student = await prisma.student.update({ where: { id: String(req.params.id) }, data: body });
    res.json(student);
  } catch (error) { next(error); }
});
app.delete("/api/students/:id", requirePermission("students", "delete"), async (req, res, next) => {
  try {
    await prisma.student.delete({ where: { id: String(req.params.id) } });
    res.status(204).end();
  } catch (error) { next(error); }
});

app.get("/api/teachers", requirePermission("teachers", "view"), async (_req, res, next) => {
  try { res.json(await prisma.teacher.findMany({ orderBy: { createdAt: "desc" } })); } catch (error) { next(error); }
});
app.post("/api/teachers", requirePermission("teachers", "create"), async (req, res, next) => {
  try { res.status(201).json(await prisma.teacher.create({ data: parseResourceBody("teachers", req.body) as Prisma.TeacherUncheckedCreateInput })); } catch (error) { next(error); }
});
app.patch("/api/teachers/:id", requirePermission("teachers", "edit"), async (req, res, next) => {
  try { res.json(await prisma.teacher.update({ where: { id: String(req.params.id) }, data: parseResourceBody("teachers", req.body, true) as Prisma.TeacherUpdateInput })); } catch (error) { next(error); }
});
app.delete("/api/teachers/:id", requirePermission("teachers", "delete"), async (req, res, next) => {
  try { await prisma.teacher.delete({ where: { id: String(req.params.id) } }); res.status(204).end(); } catch (error) { next(error); }
});

app.post("/api/applications/:id/enroll", requirePermission("applications", "edit"), requirePermission("students", "create"), async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({ where: { id: String(req.params.id) } });
    if (!application) { res.status(404).json({ error: "Application not found." }); return; }
    if (application.status !== "ACCEPTED") { res.status(409).json({ error: "Only accepted applications can be enrolled." }); return; }
    const admissionNo = `STU-${new Date().getFullYear()}-${application.referenceNo.replace(/[^a-zA-Z0-9-]/g, "").slice(-12)}`;
    const student = await prisma.$transaction(async (tx) => {
      const created = await tx.student.create({ data: {
        admissionNo, firstName: application.firstName, lastName: application.lastName,
        dateOfBirth: application.dateOfBirth, guardianName: application.guardianName,
        guardianPhone: application.guardianPhone, guardianEmail: application.guardianEmail,
        classId: application.requestedClassId, applicationId: application.id,
        documents: application.documents as Prisma.InputJsonValue
      } });
      await tx.application.update({ where: { id: application.id }, data: { status: "ENROLLED" } });
      await tx.auditLog.create({ data: { userId: req.user?.id, action: "ENROLL", module: "applications", recordId: application.id, details: { studentId: created.id } } });
      return created;
    });
    res.status(201).json(student);
  } catch (error) { next(error); }
});

app.get("/api/:resource", async (req, res, next) => {
  try {
    const { resource } = req.params;
    const permission = req.user?.permissions[resource];
    if (req.user?.role !== "SUPER_ADMIN" && !permission?.view) {
      res.status(403).json({ error: `You do not have view permission for ${resource}.` }); return;
    }
    const common = {
      classes: () => prisma.schoolClass.findMany({ include: { teacher: true, students: true, divisions: true }, orderBy: { grade: "asc" } }),
      divisions: () => prisma.division.findMany({ include: { schoolClass: true }, orderBy: [{ classId: "asc" }, { name: "asc" }] }),
      subjects: () => prisma.subject.findMany({ include: { teachers: { include: { teacher: true } }, classes: { include: { schoolClass: true } } } }),
      "academic-years": () => prisma.academicYear.findMany({ include: { terms: true }, orderBy: { startDate: "desc" } }),
      terms: () => prisma.term.findMany({ include: { academicYear: true } }),
      timetable: () => prisma.timetableEntry.findMany({ include: { subject: true, teacher: true, division: { include: { schoolClass: true } } } }),
      attendance: () => prisma.studentAttendance.findMany({ include: { student: { include: { class: true } } }, orderBy: { date: "desc" }, take: 500 }),
      "teacher-attendance": () => prisma.teacherAttendance.findMany({ include: { teacher: true }, orderBy: { date: "desc" }, take: 500 }),
      leaves: () => prisma.leaveRequest.findMany({ orderBy: { createdAt: "desc" } }),
      applications: () => prisma.application.findMany({ include: { requestedClass: true, student: true }, orderBy: { createdAt: "desc" } }),
      exams: () => prisma.exam.findMany({ include: { subject: true, marks: { include: { student: true } } } }),
      marks: () => prisma.mark.findMany({ include: { student: true, exam: { include: { subject: true } } } }),
      "fee-structures": () => prisma.feeStructure.findMany({ include: { schoolClass: true } }),
      invoices: () => prisma.invoice.findMany({ include: { student: true, feeStructure: true, payments: true }, orderBy: { createdAt: "desc" } }),
      payments: () => prisma.payment.findMany({ include: { invoice: { include: { student: true } } }, orderBy: { paidAt: "desc" } }),
      events: () => prisma.event.findMany({ orderBy: { startAt: "asc" } }),
      announcements: () => prisma.announcement.findMany({ orderBy: { createdAt: "desc" } }),
      users: () => prisma.user.findMany({ select: { id: true, name: true, email: true, active: true, role: { select: { name: true } }, createdAt: true } }),
      roles: () => prisma.role.findMany({ include: { permissions: true } }),
      permissions: () => prisma.permission.findMany({ include: { role: true } }),
      audit: () => prisma.auditLog.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 500 }),
      settings: () => prisma.schoolSetting.findMany({ orderBy: { key: "asc" } })
    };
    const getter = common[resource as keyof typeof common];
    if (!getter) { res.status(404).json({ error: "Unknown resource." }); return; }
    res.json(await getter());
  } catch (error) { next(error); }
});

app.post("/api/:resource", async (req, res, next) => {
  try {
    const resource = req.params.resource;
    const permission = req.user?.permissions[resource];
    if (req.user?.role !== "SUPER_ADMIN" && !permission?.create) { res.status(403).json({ error: `You do not have create permission for ${resource}.` }); return; }
    const body = parseResourceBody(resource, req.body);
    if (resource === "timetable") await assertNoTimetableConflict(body);
    const created = await createResource(resource, body);
    if (!created) { res.status(404).json({ error: "Unknown resource or creation not supported." }); return; }
    await prisma.auditLog.create({ data: { userId: req.user?.id, action: "CREATE", module: resource, recordId: String((created as { id?: string }).id ?? ""), details: { name: resource } } });
    res.status(201).json(created);
  } catch (error) { next(error); }
});

app.patch("/api/:resource/:id", async (req, res, next) => {
  try {
    const resource = req.params.resource;
    const permission = req.user?.permissions[resource];
    if (req.user?.role !== "SUPER_ADMIN" && !permission?.edit) { res.status(403).json({ error: `You do not have edit permission for ${resource}.` }); return; }
    const body = parseResourceBody(resource, req.body, true);
    if (resource === "timetable") {
      const existing = await prisma.timetableEntry.findUnique({ where: { id: req.params.id } });
      if (!existing) { res.status(404).json({ error: "Record not found." }); return; }
      await assertNoTimetableConflict({ ...existing, ...body }, req.params.id);
    }
    const updated = await updateResource(resource, String(req.params.id), body);
    if (!updated) { res.status(404).json({ error: "Unknown resource or update not supported." }); return; }
    await prisma.auditLog.create({ data: { userId: req.user?.id, action: "UPDATE", module: resource, recordId: req.params.id } });
    res.json(updated);
  } catch (error) { next(error); }
});

app.delete("/api/:resource/:id", async (req, res, next) => {
  try {
    const resource = req.params.resource;
    const permission = req.user?.permissions[resource];
    if (req.user?.role !== "SUPER_ADMIN" && !permission?.delete) { res.status(403).json({ error: `You do not have delete permission for ${resource}.` }); return; }
    const deleted = await deleteResource(resource, String(req.params.id));
    if (!deleted) { res.status(404).json({ error: "Unknown resource or delete not supported." }); return; }
    await prisma.auditLog.create({ data: { userId: req.user?.id, action: "DELETE", module: resource, recordId: req.params.id } });
    res.status(204).end();
  } catch (error) { next(error); }
});

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) { res.status(400).json({ error: "Validation failed.", details: error.flatten() }); return; }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") { res.status(409).json({ error: "A record with this unique value already exists." }); return; }
    if (error.code === "P2025") { res.status(404).json({ error: "Record not found." }); return; }
    if (error.code === "P2003") { res.status(409).json({ error: "This record is referenced by other records." }); return; }
  }
  console.error(error);
  res.status(500).json({ error: "An unexpected server error occurred." });
};
app.use(errorHandler);

app.listen(port, () => console.info(`Shreya API listening on http://localhost:${port}`));

type Data = Record<string, unknown>;
async function createResource(resource: string, data: Data): Promise<unknown> {
  switch (resource) {
    case "classes": return prisma.schoolClass.create({ data: data as Prisma.SchoolClassUncheckedCreateInput });
    case "divisions": return prisma.division.create({ data: data as Prisma.DivisionUncheckedCreateInput });
    case "subjects": return prisma.subject.create({ data: data as Prisma.SubjectCreateInput });
    case "academic-years": return prisma.academicYear.create({ data: data as Prisma.AcademicYearCreateInput });
    case "terms": return prisma.term.create({ data: data as Prisma.TermUncheckedCreateInput });
    case "timetable": return prisma.timetableEntry.create({ data: data as Prisma.TimetableEntryUncheckedCreateInput });
    case "attendance": return prisma.studentAttendance.create({ data: data as Prisma.StudentAttendanceUncheckedCreateInput });
    case "teacher-attendance": return prisma.teacherAttendance.create({ data: data as Prisma.TeacherAttendanceUncheckedCreateInput });
    case "leaves": return prisma.leaveRequest.create({ data: data as Prisma.LeaveRequestCreateInput });
    case "applications": return prisma.application.create({ data: data as Prisma.ApplicationUncheckedCreateInput });
    case "exams": return prisma.exam.create({ data: data as Prisma.ExamUncheckedCreateInput });
    case "marks": return prisma.mark.create({ data: data as Prisma.MarkUncheckedCreateInput });
    case "fee-structures": return prisma.feeStructure.create({ data: data as Prisma.FeeStructureUncheckedCreateInput });
    case "invoices": return prisma.invoice.create({ data: { ...data, paidAmount: 0, status: "PENDING" } as Prisma.InvoiceUncheckedCreateInput });
    case "payments": return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id: String(data.invoiceId) } });
      if (!invoice) throw new ZodError([{ code: "custom", path: ["invoiceId"], message: "Invoice not found." }]);
      const amount = Number(data.amount);
      const remaining = Number(invoice.amount) - Number(invoice.paidAmount);
      if (amount <= 0 || amount > remaining) throw new ZodError([{ code: "custom", path: ["amount"], message: "Payment must be positive and cannot exceed the outstanding balance." }]);
      const payment = await tx.payment.create({ data: data as Prisma.PaymentUncheckedCreateInput });
      const paidAmount = Number(invoice.paidAmount) + amount;
      await tx.invoice.update({ where: { id: invoice.id }, data: { paidAmount, status: paidAmount >= Number(invoice.amount) ? "PAID" : "PARTIAL" } });
      return payment;
    });
    case "events": return prisma.event.create({ data: data as Prisma.EventCreateInput });
    case "announcements": return prisma.announcement.create({ data: data as Prisma.AnnouncementCreateInput });
    case "users": {
      const password = String(data.password);
      if (password.length < 12) throw new ZodError([{ code: "custom", path: ["password"], message: "Password must be at least 12 characters." }]);
      return prisma.user.create({
        data: { name: String(data.name), email: String(data.email).toLowerCase(), passwordHash: await bcrypt.hash(password, 12), roleId: String(data.roleId), active: data.active === undefined ? true : Boolean(data.active) },
        select: { id: true, name: true, email: true, active: true }
      });
    }
    case "settings": return prisma.schoolSetting.upsert({ where: { key: String(data.key) }, create: data as Prisma.SchoolSettingCreateInput, update: { value: data.value as Prisma.InputJsonValue } });
    default: return null;
  }
}
async function updateResource(resource: string, id: string, data: Data): Promise<unknown> {
  switch (resource) {
    case "students": return prisma.student.update({ where: { id }, data: data as Prisma.StudentUpdateInput });
    case "teachers": return prisma.teacher.update({ where: { id }, data: data as Prisma.TeacherUpdateInput });
    case "classes": return prisma.schoolClass.update({ where: { id }, data: data as Prisma.SchoolClassUpdateInput });
    case "divisions": return prisma.division.update({ where: { id }, data: data as Prisma.DivisionUpdateInput });
    case "subjects": return prisma.subject.update({ where: { id }, data: data as Prisma.SubjectUpdateInput });
    case "academic-years": return prisma.academicYear.update({ where: { id }, data: data as Prisma.AcademicYearUpdateInput });
    case "terms": return prisma.term.update({ where: { id }, data: data as Prisma.TermUpdateInput });
    case "timetable": return prisma.timetableEntry.update({ where: { id }, data: data as Prisma.TimetableEntryUpdateInput });
    case "attendance": return prisma.studentAttendance.update({ where: { id }, data: data as Prisma.StudentAttendanceUpdateInput });
    case "teacher-attendance": return prisma.teacherAttendance.update({ where: { id }, data: data as Prisma.TeacherAttendanceUpdateInput });
    case "leaves": return prisma.leaveRequest.update({ where: { id }, data: data as Prisma.LeaveRequestUpdateInput });
    case "applications": return prisma.application.update({ where: { id }, data: data as Prisma.ApplicationUpdateInput });
    case "exams": return prisma.exam.update({ where: { id }, data: data as Prisma.ExamUpdateInput });
    case "marks": return prisma.mark.update({ where: { id }, data: data as Prisma.MarkUpdateInput });
    case "fee-structures": return prisma.feeStructure.update({ where: { id }, data: data as Prisma.FeeStructureUpdateInput });
    case "invoices": return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id } });
      if (!invoice) throw new Prisma.PrismaClientKnownRequestError("Record not found.", { code: "P2025", clientVersion: Prisma.prismaVersion.client });
      const amount = Number(data.amount ?? invoice.amount);
      const paidAmount = Number(invoice.paidAmount);
      if (amount < paidAmount) throw new ZodError([{ code: "custom", path: ["amount"], message: "Invoice amount cannot be less than payments already recorded." }]);
      return tx.invoice.update({ where: { id }, data: { ...data, paidAmount, status: paidAmount >= amount ? "PAID" : paidAmount > 0 ? "PARTIAL" : "PENDING" } as Prisma.InvoiceUpdateInput });
    });
    case "payments": return prisma.$transaction(async (tx) => {
      const current = await tx.payment.findUnique({ where: { id } });
      if (!current) throw new Prisma.PrismaClientKnownRequestError("Record not found.", { code: "P2025", clientVersion: Prisma.prismaVersion.client });
      const invoiceId = String(data.invoiceId ?? current.invoiceId);
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) throw new ZodError([{ code: "custom", path: ["invoiceId"], message: "Invoice not found." }]);
      const amount = Number(data.amount ?? current.amount);
      const aggregate = await tx.payment.aggregate({ where: { invoiceId, id: { not: id } }, _sum: { amount: true } });
      const paidAmount = Number(aggregate._sum.amount ?? 0) + amount;
      if (amount <= 0 || paidAmount > Number(invoice.amount)) throw new ZodError([{ code: "custom", path: ["amount"], message: "Payments must be positive and cannot exceed the invoice balance." }]);
      const updated = await tx.payment.update({ where: { id }, data: data as Prisma.PaymentUpdateInput });
      await tx.invoice.update({ where: { id: invoice.id }, data: { paidAmount, status: paidAmount >= Number(invoice.amount) ? "PAID" : "PARTIAL" } });
      if (current.invoiceId !== invoiceId) {
        const oldInvoice = await tx.invoice.findUniqueOrThrow({ where: { id: current.invoiceId } });
        const oldAggregate = await tx.payment.aggregate({ where: { invoiceId: current.invoiceId }, _sum: { amount: true } });
        const oldPaid = Number(oldAggregate._sum.amount ?? 0);
        await tx.invoice.update({ where: { id: oldInvoice.id }, data: { paidAmount: oldPaid, status: oldPaid >= Number(oldInvoice.amount) ? "PAID" : oldPaid > 0 ? "PARTIAL" : "PENDING" } });
      }
      return updated;
    });
    case "events": return prisma.event.update({ where: { id }, data: data as Prisma.EventUpdateInput });
    case "announcements": return prisma.announcement.update({ where: { id }, data: data as Prisma.AnnouncementUpdateInput });
    case "users": {
      const safeData = { ...data };
      if (typeof safeData.password === "string") {
        if (safeData.password.length < 12) throw new ZodError([{ code: "custom", path: ["password"], message: "Password must be at least 12 characters." }]);
        safeData.passwordHash = await bcrypt.hash(safeData.password, 12);
        delete safeData.password;
      }
      return prisma.user.update({ where: { id }, data: safeData as Prisma.UserUpdateInput, select: { id: true, name: true, email: true, active: true } });
    }
    default: return null;
  }
}
async function deleteResource(resource: string, id: string): Promise<unknown> {
  switch (resource) {
    case "students": return prisma.student.delete({ where: { id } });
    case "teachers": return prisma.teacher.delete({ where: { id } });
    case "classes": return prisma.schoolClass.delete({ where: { id } });
    case "divisions": return prisma.division.delete({ where: { id } });
    case "subjects": return prisma.subject.delete({ where: { id } });
    case "academic-years": return prisma.academicYear.delete({ where: { id } });
    case "terms": return prisma.term.delete({ where: { id } });
    case "timetable": return prisma.timetableEntry.delete({ where: { id } });
    case "attendance": return prisma.studentAttendance.delete({ where: { id } });
    case "teacher-attendance": return prisma.teacherAttendance.delete({ where: { id } });
    case "leaves": return prisma.leaveRequest.delete({ where: { id } });
    case "applications": return prisma.application.delete({ where: { id } });
    case "exams": return prisma.exam.delete({ where: { id } });
    case "marks": return prisma.mark.delete({ where: { id } });
    case "fee-structures": return prisma.feeStructure.delete({ where: { id } });
    case "invoices": return prisma.invoice.delete({ where: { id } });
    case "payments": return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { id } });
      if (!payment) throw new Prisma.PrismaClientKnownRequestError("Payment not found.", { code: "P2025", clientVersion: Prisma.prismaVersion.client });
      const deleted = await tx.payment.delete({ where: { id } });
      const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: payment.invoiceId } });
      const paidAmount = Math.max(0, Number(invoice.paidAmount) - Number(payment.amount));
      await tx.invoice.update({ where: { id: invoice.id }, data: { paidAmount, status: paidAmount === 0 ? "PENDING" : "PARTIAL" } });
      return deleted;
    });
    case "events": return prisma.event.delete({ where: { id } });
    case "announcements": return prisma.announcement.delete({ where: { id } });
    case "users": return prisma.user.delete({ where: { id } });
    case "settings": return prisma.schoolSetting.delete({ where: { id } });
    default: return null;
  }
}
