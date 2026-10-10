export type FieldSpec = {
  key: string; label: string; type?: "text" | "email" | "tel" | "number" | "date" | "select" | "textarea" | "time";
  required?: boolean; options?: string[]; placeholder?: string;
};
export type ModuleSpec = {
  path: string; label: string; resource: string; group: string; description: string; icon: string;
  fields: FieldSpec[]; columns: string[];
};

export const modules: ModuleSpec[] = [
  { path: "/students", label: "Students", resource: "students", group: "People", description: "Student profiles, guardians, documents, and class assignments.", icon: "GraduationCap", fields: [
    { key: "admissionNo", label: "Admission number", required: true }, { key: "firstName", label: "First name", required: true }, { key: "lastName", label: "Last name", required: true },
    { key: "email", label: "Email", type: "email" }, { key: "phone", label: "Phone", type: "tel" }, { key: "guardianName", label: "Guardian name" },
    { key: "guardianPhone", label: "Guardian phone", type: "tel" }, { key: "classId", label: "Class ID" }, { key: "photoUrl", label: "Photo URL" }
  ], columns: ["admissionNo", "firstName", "lastName", "class", "guardianName", "guardianPhone"] },
  { path: "/teachers", label: "Teachers", resource: "teachers", group: "People", description: "Faculty profiles, contact details, and qualifications.", icon: "BriefcaseBusiness", fields: [
    { key: "employeeNo", label: "Employee number", required: true }, { key: "firstName", label: "First name", required: true }, { key: "lastName", label: "Last name", required: true },
    { key: "email", label: "Email", type: "email", required: true }, { key: "phone", label: "Phone", type: "tel" }, { key: "qualifications", label: "Qualifications", type: "textarea" }, { key: "photoUrl", label: "Photo URL" }
  ], columns: ["employeeNo", "firstName", "lastName", "email", "phone", "qualifications"] },
  { path: "/admissions", label: "Admissions", resource: "applications", group: "People", description: "Review applications, verify documents, and manage enrollment.", icon: "ClipboardCheck", fields: [
    { key: "referenceNo", label: "Reference number", required: true }, { key: "firstName", label: "First name", required: true }, { key: "lastName", label: "Last name", required: true },
    { key: "guardianName", label: "Guardian name", required: true }, { key: "guardianPhone", label: "Guardian phone", required: true }, { key: "guardianEmail", label: "Guardian email", type: "email" },
    { key: "status", label: "Status", type: "select", options: ["APPLIED", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "ENROLLED"] }, { key: "requestedClassId", label: "Requested class ID" }
  ], columns: ["referenceNo", "firstName", "lastName", "guardianName", "status", "createdAt"] },
  { path: "/classes", label: "Classes", resource: "classes", group: "Academics", description: "Class levels, homeroom teachers, divisions, and capacity.", icon: "School", fields: [
    { key: "name", label: "Class name", required: true }, { key: "grade", label: "Grade", type: "number", required: true }, { key: "capacity", label: "Capacity", type: "number" }, { key: "teacherId", label: "Class teacher ID" }, { key: "academicYearId", label: "Academic year ID" }
  ], columns: ["name", "grade", "capacity", "teacher", "students"] },
  { path: "/divisions", label: "Divisions", resource: "divisions", group: "Academics", description: "Sections and class grouping.", icon: "PanelsTopLeft", fields: [
    { key: "name", label: "Division name", required: true }, { key: "classId", label: "Class ID", required: true }
  ], columns: ["name", "schoolClass"] },
  { path: "/subjects", label: "Subjects", resource: "subjects", group: "Academics", description: "Subjects, class mappings, syllabus, and teaching assignments.", icon: "BookOpen", fields: [
    { key: "name", label: "Subject name", required: true }, { key: "code", label: "Subject code", required: true }
  ], columns: ["name", "code", "teachers", "classes"] },
  { path: "/academic-years", label: "Academic years", resource: "academic-years", group: "Academics", description: "Academic calendars, active year, and terms.", icon: "CalendarDays", fields: [
    { key: "name", label: "Academic year", required: true }, { key: "startDate", label: "Start date", type: "date", required: true }, { key: "endDate", label: "End date", type: "date", required: true }, { key: "active", label: "Active (true/false)" }
  ], columns: ["name", "startDate", "endDate", "active", "terms"] },
  { path: "/terms", label: "Terms & semesters", resource: "terms", group: "Academics", description: "Term dates within an academic year.", icon: "CalendarRange", fields: [
    { key: "name", label: "Term name", required: true }, { key: "startDate", label: "Start date", type: "date", required: true }, { key: "endDate", label: "End date", type: "date", required: true }, { key: "academicYearId", label: "Academic year ID", required: true }
  ], columns: ["name", "startDate", "endDate", "academicYear"] },
  { path: "/timetable", label: "Timetable", resource: "timetable", group: "Academics", description: "Weekly class schedule with room and teacher conflict checks.", icon: "Clock3", fields: [
    { key: "divisionId", label: "Division ID", required: true }, { key: "subjectId", label: "Subject ID", required: true }, { key: "teacherId", label: "Teacher ID", required: true },
    { key: "dayOfWeek", label: "Day (0 Sun – 6 Sat)", type: "number", required: true }, { key: "startTime", label: "Start time", type: "time", required: true }, { key: "endTime", label: "End time", type: "time", required: true }, { key: "room", label: "Room", required: true }
  ], columns: ["division", "subject", "teacher", "dayOfWeek", "startTime", "endTime", "room"] },
  { path: "/attendance", label: "Attendance", resource: "attendance", group: "Student life", description: "Daily student attendance, low-attendance alerts, and class reports.", icon: "ClipboardCheck", fields: [
    { key: "studentId", label: "Student ID", required: true }, { key: "date", label: "Date", type: "date", required: true }, { key: "status", label: "Status", type: "select", options: ["PRESENT", "ABSENT", "LATE", "LEAVE"], required: true }, { key: "note", label: "Note", type: "textarea" }
  ], columns: ["student", "date", "status", "note"] },
  { path: "/teacher-attendance", label: "Teacher attendance", resource: "teacher-attendance", group: "Student life", description: "Staff attendance and daily leave records.", icon: "UserCheck", fields: [
    { key: "teacherId", label: "Teacher ID", required: true }, { key: "date", label: "Date", type: "date", required: true }, { key: "status", label: "Status", type: "select", options: ["PRESENT", "ABSENT", "LATE", "LEAVE"], required: true }, { key: "note", label: "Note" }
  ], columns: ["teacher", "date", "status", "note"] },
  { path: "/leaves", label: "Leave management", resource: "leaves", group: "Student life", description: "Review staff and student leave requests.", icon: "CalendarOff", fields: [
    { key: "personType", label: "Person type", type: "select", options: ["STUDENT", "TEACHER"], required: true }, { key: "personId", label: "Person ID", required: true }, { key: "startDate", label: "Start date", type: "date", required: true }, { key: "endDate", label: "End date", type: "date", required: true }, { key: "reason", label: "Reason", type: "textarea", required: true }, { key: "status", label: "Status", type: "select", options: ["PENDING", "APPROVED", "REJECTED"] }
  ], columns: ["personType", "personId", "startDate", "endDate", "reason", "status"] },
  { path: "/exams", label: "Examinations", resource: "exams", group: "Academics", description: "Exam schedules, subjects, and grading setup.", icon: "FileCheck2", fields: [
    { key: "name", label: "Exam name", required: true }, { key: "term", label: "Term", required: true }, { key: "date", label: "Exam date", type: "date" }, { key: "subjectId", label: "Subject ID", required: true }, { key: "maxMarks", label: "Maximum marks", type: "number" }
  ], columns: ["name", "term", "date", "subject", "maxMarks", "marks"] },
  { path: "/marks", label: "Results & marks", resource: "marks", group: "Academics", description: "Enter marks and review calculated exam performance.", icon: "Award", fields: [
    { key: "studentId", label: "Student ID", required: true }, { key: "examId", label: "Exam ID", required: true }, { key: "score", label: "Score", type: "number", required: true }, { key: "grade", label: "Grade" }
  ], columns: ["student", "exam", "score", "grade"] },
  { path: "/fee-structures", label: "Fee structures", resource: "fee-structures", group: "Finance", description: "Set tuition, term fees, concessions, and scholarships.", icon: "WalletCards", fields: [
    { key: "name", label: "Fee name", required: true }, { key: "amount", label: "Amount (INR)", type: "number", required: true }, { key: "dueDate", label: "Due date", type: "date" }, { key: "classId", label: "Class ID" }
  ], columns: ["name", "amount", "dueDate", "schoolClass"] },
  { path: "/invoices", label: "Invoices & dues", resource: "invoices", group: "Finance", description: "Generate invoices, review outstanding balances, and concessions.", icon: "ReceiptText", fields: [
    { key: "invoiceNo", label: "Invoice number", required: true }, { key: "studentId", label: "Student ID", required: true }, { key: "feeStructureId", label: "Fee structure ID", required: true }, { key: "amount", label: "Amount", type: "number", required: true }, { key: "paidAmount", label: "Paid amount", type: "number" }, { key: "dueDate", label: "Due date", type: "date" }, { key: "status", label: "Status", type: "select", options: ["PENDING", "PARTIAL", "PAID", "OVERDUE"] }, { key: "scholarship", label: "Scholarship / concession" }
  ], columns: ["invoiceNo", "student", "amount", "paidAmount", "dueDate", "status"] },
  { path: "/payments", label: "Payments & receipts", resource: "payments", group: "Finance", description: "Record payments, reconcile fee balances, and print receipts.", icon: "CreditCard", fields: [
    { key: "receiptNo", label: "Receipt number", required: true }, { key: "invoiceId", label: "Invoice ID", required: true }, { key: "amount", label: "Amount", type: "number", required: true }, { key: "method", label: "Method", type: "select", options: ["CASH", "CARD", "BANK_TRANSFER", "UPI"], required: true }
  ], columns: ["receiptNo", "invoice", "amount", "method", "paidAt"] },
  { path: "/events", label: "Events calendar", resource: "events", group: "Communication", description: "Plan school events and upcoming dates.", icon: "CalendarHeart", fields: [
    { key: "title", label: "Event title", required: true }, { key: "description", label: "Description", type: "textarea" }, { key: "startAt", label: "Starts", type: "date", required: true }, { key: "endAt", label: "Ends", type: "date" }, { key: "location", label: "Location" }
  ], columns: ["title", "startAt", "endAt", "location"] },
  { path: "/announcements", label: "Announcements", resource: "announcements", group: "Communication", description: "Publish updates for school roles and classes.", icon: "Megaphone", fields: [
    { key: "title", label: "Title", required: true }, { key: "body", label: "Message", type: "textarea", required: true }, { key: "audience", label: "Audience", type: "select", options: ["ALL", "ROLE", "CLASS"] }, { key: "target", label: "Target role or class" }
  ], columns: ["title", "audience", "target", "published", "createdAt"] },
  { path: "/users", label: "User management", resource: "users", group: "Administration", description: "Manage administrator and staff accounts.", icon: "UsersRound", fields: [
    { key: "name", label: "Name", required: true }, { key: "email", label: "Email", type: "email", required: true }, { key: "password", label: "Initial password", required: true }, { key: "roleId", label: "Role ID", required: true }, { key: "active", label: "Active" }
  ], columns: ["name", "email", "role", "active", "createdAt"] },
  { path: "/roles", label: "Roles & permissions", resource: "roles", group: "Administration", description: "Review role assignments and the module permission matrix.", icon: "ShieldCheck", fields: [], columns: ["name", "users", "permissions"] },
  { path: "/audit", label: "Audit log", resource: "audit", group: "Administration", description: "Trace administrative changes and account activity.", icon: "History", fields: [], columns: ["createdAt", "user", "action", "module", "recordId"] },
  { path: "/settings", label: "Institution settings", resource: "settings", group: "Administration", description: "School profile, academic preferences, and operational settings.", icon: "Settings2", fields: [
    { key: "key", label: "Setting key", required: true }, { key: "value", label: "JSON value", type: "textarea", required: true }
  ], columns: ["key", "value", "updatedAt"] }
];

export const moduleByPath = Object.fromEntries(modules.map((item) => [item.path, item]));
