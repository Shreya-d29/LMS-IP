import dotenv from "dotenv";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient, RoleName } from "@prisma/client";

dotenv.config({ path: process.env.ENV_FILE ?? resolve(process.cwd(), "../.env") });
const prisma = new PrismaClient();
const modules = [
  "dashboard", "students", "teachers", "applications", "classes", "divisions", "subjects",
  "academic-years", "terms", "timetable", "attendance", "teacher-attendance", "leaves",
  "exams", "marks", "fee-structures", "invoices", "payments", "events", "announcements",
  "users", "roles", "permissions", "audit", "settings", "reports"
];

async function main(): Promise<void> {
  const names: RoleName[] = ["SUPER_ADMIN", "ADMIN", "TEACHER", "ACCOUNTANT", "STAFF"];
  for (const name of names) {
    const role = await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
    for (const module of modules) {
      const full = name === "SUPER_ADMIN" || name === "ADMIN";
      const teacher = name === "TEACHER" && ["dashboard", "students", "attendance", "timetable", "exams", "marks", "events", "announcements"].includes(module);
      const accountant = name === "ACCOUNTANT" && ["dashboard", "fee-structures", "invoices", "payments", "students", "reports"].includes(module);
      const staff = name === "STAFF" && ["dashboard", "students", "applications", "attendance", "events", "announcements"].includes(module);
      await prisma.permission.upsert({
        where: { roleId_module: { roleId: role.id, module } },
        update: {},
        create: { roleId: role.id, module, canView: full || teacher || accountant || staff, canCreate: full, canEdit: full, canDelete: full }
      });
    }
  }
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: "SUPER_ADMIN" } });
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@shreya.edu" },
    update: {},
    create: { name: "Shreya Admin", email: "admin@shreya.edu", passwordHash, roleId: adminRole.id }
  });

  const year = await prisma.academicYear.upsert({
    where: { name: "2026–2027" }, update: { active: true },
    create: { name: "2026–2027", startDate: new Date("2026-06-01"), endDate: new Date("2027-05-31"), active: true }
  });
  await prisma.term.upsert({
    where: { name_academicYearId: { name: "Term 1", academicYearId: year.id } },
    update: {}, create: { name: "Term 1", startDate: new Date("2026-06-01"), endDate: new Date("2026-10-31"), academicYearId: year.id }
  });

  const teacher = await prisma.teacher.upsert({
    where: { employeeNo: "T-001" }, update: {},
    create: { employeeNo: "T-001", firstName: "Aarav", lastName: "Sharma", email: "aarav@shreya.edu", phone: "+91 98765 43210", qualifications: "M.Sc. Mathematics, B.Ed." }
  });
  const schoolClass = await prisma.schoolClass.upsert({
    where: { name_academicYearId: { name: "Grade 8", academicYearId: year.id } }, update: {},
    create: { name: "Grade 8", grade: 8, capacity: 40, academicYearId: year.id, teacherId: teacher.id }
  });
  const division = await prisma.division.upsert({
    where: { name_classId: { name: "A", classId: schoolClass.id } }, update: {},
    create: { name: "A", classId: schoolClass.id }
  });
  const subject = await prisma.subject.upsert({
    where: { code: "MATH-08" }, update: {},
    create: { name: "Mathematics", code: "MATH-08" }
  });
  await prisma.subjectTeacher.upsert({
    where: { subjectId_teacherId: { subjectId: subject.id, teacherId: teacher.id } },
    update: {}, create: { subjectId: subject.id, teacherId: teacher.id }
  });
  await prisma.classSubject.upsert({
    where: { classId_subjectId: { classId: schoolClass.id, subjectId: subject.id } },
    update: {}, create: { classId: schoolClass.id, subjectId: subject.id, syllabus: ["Numbers", "Algebra", "Geometry"] }
  });

  const sampleStudents = [
    { admissionNo: "STU-2025-001", firstName: "Anaya", lastName: "Patel", guardianName: "Rohan Patel", guardianPhone: "+91 98765 00001" },
    { admissionNo: "STU-2025-002", firstName: "Kabir", lastName: "Mehta", guardianName: "Neha Mehta", guardianPhone: "+91 98765 00002" },
    { admissionNo: "STU-2025-003", firstName: "Diya", lastName: "Nair", guardianName: "Arun Nair", guardianPhone: "+91 98765 00003" },
    { admissionNo: "STU-2025-004", firstName: "Vivaan", lastName: "Reddy", guardianName: "Sana Reddy", guardianPhone: "+91 98765 00004" },
    { admissionNo: "STU-2025-005", firstName: "Mira", lastName: "Kapoor", guardianName: "Ishita Kapoor", guardianPhone: "+91 98765 00005" }
  ];
  for (const student of sampleStudents) {
    await prisma.student.upsert({
      where: { admissionNo: student.admissionNo }, update: {},
      create: { ...student, email: `${student.firstName.toLowerCase()}@students.shreya.edu`, classId: schoolClass.id },
      update: { classId: schoolClass.id }
    });
  }
  const fee = await prisma.feeStructure.upsert({
    where: { id: "demo-tuition-fee" }, update: { dueDate: new Date("2027-04-15"), classId: schoolClass.id },
    create: { id: "demo-tuition-fee", name: "Annual tuition", amount: 48000, dueDate: new Date("2027-04-15"), classId: schoolClass.id }
  });
  const students = await prisma.student.findMany({ take: 5, orderBy: { admissionNo: "asc" } });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const [index, student] of students.entries()) {
    await prisma.studentAttendance.upsert({
      where: { studentId_date: { studentId: student.id, date: today } },
      update: { status: index < 4 ? "PRESENT" : "ABSENT" },
      create: { studentId: student.id, date: today, status: index < 4 ? "PRESENT" : "ABSENT" }
    });
  }
  const exam = await prisma.exam.upsert({
    where: { id: "demo-exam-midterm" }, update: {},
    create: { id: "demo-exam-midterm", name: "Mid-term assessment", term: "Term 1", date: new Date("2026-09-15"), maxMarks: 100, subjectId: subject.id }
  });
  for (const [index, student] of students.entries()) {
    await prisma.mark.upsert({
      where: { studentId_examId: { studentId: student.id, examId: exam.id } },
      update: { score: 74 + index * 5, grade: index > 2 ? "A" : "B" },
      create: { studentId: student.id, examId: exam.id, score: 74 + index * 5, grade: index > 2 ? "A" : "B" }
    });
  }
  for (const [index, student] of students.entries()) {
    const invoiceNo = `INV-2026-${String(index + 1).padStart(3, "0")}`;
    const paidAmount = index < 3 ? 48000 : index === 3 ? 24000 : 0;
    await prisma.invoice.upsert({
      where: { invoiceNo }, update: { paidAmount, status: paidAmount === 48000 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "PENDING", dueDate: new Date("2027-04-15") },
      create: { invoiceNo, studentId: student.id, feeStructureId: fee.id, amount: 48000, paidAmount, status: paidAmount === 48000 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "PENDING", dueDate: new Date("2027-04-15") }
    });
  }
  const demoInvoices = await prisma.invoice.findMany({ where: { invoiceNo: { startsWith: "INV-2026-" }, paidAmount: { gt: 0 } }, orderBy: { invoiceNo: "asc" } });
  for (const [index, invoice] of demoInvoices.entries()) {
    await prisma.payment.upsert({
      where: { receiptNo: `RCP-2026-${String(index + 1).padStart(3, "0")}` },
      update: { amount: invoice.paidAmount },
      create: { receiptNo: `RCP-2026-${String(index + 1).padStart(3, "0")}`, invoiceId: invoice.id, amount: invoice.paidAmount, method: index % 2 ? "UPI" : "BANK_TRANSFER" }
    });
  }
  await prisma.event.upsert({
    where: { id: "demo-event-science" }, update: {},
    create: { id: "demo-event-science", title: "Science Exhibition", description: "Student-led projects and discoveries.", startAt: new Date("2026-10-18T09:00:00"), endAt: new Date("2026-10-18T15:00:00"), location: "Main Hall" }
  });
  await prisma.event.upsert({
    where: { id: "demo-event-parents" }, update: {},
    create: { id: "demo-event-parents", title: "Parent–Teacher Meeting", description: "Term progress meetings.", startAt: new Date("2026-10-24T10:00:00"), endAt: new Date("2026-10-24T13:00:00"), location: "Classrooms" }
  });
  await prisma.schoolSetting.upsert({
    where: { key: "school-profile" }, update: {},
    create: { key: "school-profile", value: { name: "Shreya International School", address: "12 Garden Road, Bengaluru", phone: "+91 80 4000 1000", email: "office@shreya.edu", currency: "INR" } }
  });
  console.info("Seeded Shreya demo data. Login: admin@shreya.edu / ChangeMe123!");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
