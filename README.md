# SHREENIL.COM — STUDENT MVP MASTER IMPLEMENTATION

> **“Every Student. One Digital Twin. One Lifetime Learning Journey.”**

---

## 1. Overview & Architecture

Shreenil is an AI-first Virtual University and holistic learning ecosystem. This repository contains the complete **Student MVP** structured as a production-oriented Modular Monolith:

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide + Zustand + TanStack Query
- **Backend**: Java 21 + Spring Boot 3.3.4 + Spring Security OAuth2 + Spring Data JPA + Hibernate + Flyway + OpenAPI (SpringDoc)
- **Database**: PostgreSQL with UUID keys and immutable Flyway schema migrations (`V1` through `V9`)
- **Authentication**: Keycloak OpenID Connect / OAuth2 Resource Server JWT validation + Developer bypass mode
- **Curriculum**: Real **Vishwakarma Institute of Technology (VIT)** B.Tech CSE (Artificial Intelligence) AY 2026-27 syllabus data derived directly from `syllabus.pdf`.

---

## 2. Directory Structure

```
shreenil/
├── backend/                        # Spring Boot 3.3.4 Application
│   ├── src/main/java/com/shreenil/
│   │   ├── config/                 # Security, CORS, OpenAPI Swagger
│   │   ├── common/                 # GlobalExceptionHandler, ApiResponse, ErrorCode, BaseEntity
│   │   ├── auth/                   # Keycloak JWT Converter, UserPrincipal, SecurityUtils
│   │   ├── user/                   # User profile, role-aware navigation
│   │   ├── academic/               # VIT Syllabus: Institution, Program, Course, Unit, Topic, Practical, CO
│   │   ├── profile/                # StudentProfile, Skills, Interests, Digital Twin Lite, Dashboard
│   │   ├── classroom/              # LiveClasses (Jitsi), RecordedLectures, TimetableSlots
│   │   ├── homework/               # Assignments, Submissions
│   │   ├── attendance/             # AttendanceRecords, Compliance summaries
│   │   ├── exams/                  # GradeRecords, Semester evaluations, Official Report Card
│   │   ├── library/                # Digital library catalog & search
│   │   ├── ai/                     # Syllabus-aware AI Learning Mentor service boundary
│   │   └── health/                 # Health check endpoint
│   ├── src/main/resources/
│   │   ├── db/migration/           # Flyway migrations V1__core_auth to V9__seed_demo_student
│   │   └── application.yml         # Spring configuration profiles (dev, test, prod)
│   └── pom.xml                     # Maven dependencies & build configuration
├── frontend/                       # React 19 + TypeScript + Vite Frontend
│   ├── src/
│   │   ├── components/ui/          # Premium design system (Buttons, Cards, Badges, Tables, Inputs)
│   │   ├── components/layout/      # DashboardLayout, Sidebar, Topbar, Search, CourseLayout
│   │   ├── services/api/           # Typed API modules (studentApi, academicApi, homeworkApi, etc.)
│   │   ├── pages/
│   │   │   ├── dashboards/         # StudentDashboard (Digital Twin Lite)
│   │   │   ├── student/            # Academics, Courses, Timetable, Homework, Attendance, Report Card, Classroom, Library, AI Mentor
│   │   │   └── common/             # Profile, Settings, ComingSoon modules (Sports, Spiritual, Innovation, Career, XR)
│   │   └── routes/AppRoutes.tsx    # Role-based & student navigation routes
│   └── package.json
├── infra/                          # Docker & Local Infrastructure
│   ├── docker-compose.yml          # PostgreSQL, Keycloak, Backend services
│   ├── Dockerfile                  # Multi-stage production container build
│   └── keycloak/
│       └── shreenil-realm.json     # Keycloak realm with ROLE_STUDENT and demo student
├── docs/                           # Architecture, API specifications & syllabus source
├── .env.example                    # Environment configuration template
└── README.md                       # Master engineering documentation
```

---

## 3. Real VIT Curriculum & Demo Data

The academic curriculum is modeled hierarchically and seeded from **VIT B.Tech CSE (AI) AY 2026-27** (`docs/academic/syllabus.pdf`):

- **Institution**: Vishwakarma Institute of Technology, Pune
- **Program**: B.Tech Computer Science & Engineering (Artificial Intelligence)
- **Academic Year**: AY 2026-27 (Year 3 / Semester V / Module V)
- **Courses**:
  - `CI3001` — Deep Learning (4.0 Credits, 3 Theory + 2 Lab, Units I-VI, Practicals 1-12, CO1-CO6)
  - `CI3202` — Operating System (4.0 Credits)
  - `CI3003D` — MLOPS (4.0 Credits)
  - `CI3203B` — Distributed and Federated Learning (4.0 Credits)
  - `CI3203A` — Ethical and Responsible AI (4.0 Credits)
  - `CI3203C` — Information Security (4.0 Credits)

### Real vs. Mock Separation
- **Real Academic Data**: Institution, Program, Course codes, Credits, Theory/Lab hours, Prerequisites, Objectives, Relevance, Units, Topics, Practicals, Course Outcomes, Assessment Scheme, Textbooks.
- **Mock Student Activity**: Aarav Sharma's attendance records, quiz submissions, study streak (18 days), CGPA (8.92), and AI mentor chat interactions.

---

## 4. Key REST API Endpoints (`/api/v1/`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Service health status |
| `GET` | `/api/v1/users/me` | Current authenticated user identity |
| `GET` | `/api/v1/users/me/navigation` | Dynamic role-aware navigation items |
| `GET` | `/api/v1/students/me` | Student profile & Digital Twin Lite |
| `GET` | `/api/v1/students/me/dashboard` | Aggregated student dashboard |
| `GET` | `/api/v1/students/me/progress` | Skill proficiencies & completion metrics |
| `GET` | `/api/v1/academic/programs` | List degree programs |
| `GET` | `/api/v1/academic/courses` | List courses (VIT Module V) |
| `GET` | `/api/v1/academic/courses/{id}` | Deep Learning syllabus, units & practicals |
| `GET` | `/api/v1/students/me/timetable` | Weekly timetable schedule |
| `GET` | `/api/v1/students/me/homework` | Assignment list with submission statuses |
| `POST` | `/api/v1/homework/{id}/submission` | Submit assignment solution |
| `GET` | `/api/v1/students/me/attendance` | Attendance compliance & logs |
| `GET` | `/api/v1/students/me/report-card` | Official transcript & semester GPA |
| `GET` | `/api/v1/students/me/classes` | Scheduled live virtual classes (Jitsi) |
| `GET` | `/api/v1/library/items` | Searchable digital library repository |
| `POST` | `/api/v1/ai/chat` | AI Learning Mentor conversation boundary |

---

## 5. Local Quickstart

### Prerequisites
- Java 21+ (`java -version`)
- Maven 3.9+ (`mvn -version`)
- Node.js 20+ & npm (`npm -v`)
- Docker & Docker Compose (Optional for full containerized stack)

### Step 1: Start Infrastructure (PostgreSQL & Keycloak)
```bash
cd infra
docker-compose up -d postgres keycloak
```

### Step 2: Start Spring Boot Backend
```bash
cd backend
mvn spring-boot:run
```
- Swagger API Docs: `http://localhost:8081/swagger-ui.html`
- Health Endpoint: `http://localhost:8081/api/v1/health`

### Step 3: Start React Frontend
```bash
cd frontend
npm install
npm run dev
```
- Student Portal: `http://localhost:5180` (or configured port)

---

## School administration portal

The separate Shreya administrator experience lives in [`admin-portal/`](./admin-portal/README.md) and does not replace or change the student portal. It includes its own React/TypeScript UI, Express/Prisma API, PostgreSQL schema, JWT/RBAC, and repeatable demo seed. Follow its README for database setup and run instructions.

---

## 6. Automated Testing & Verification

### Backend Tests (JUnit 5 + Spring Boot Test + MockMvc)
```bash
cd backend
mvn test
```
*Result: 7/7 tests pass cleanly.*

### Frontend Tests (Vitest) & Production Build
```bash
cd frontend
npm test
npm run build
```
*Result: 8/8 tests pass, production bundle generated cleanly.*
