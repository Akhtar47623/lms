# LMS Platform — Frontend

React 19 web application for the Learning Management System.

## Tech Stack

- **React 19** + TypeScript + Vite
- **Tailwind CSS v4** + Shadcn UI components
- **Redux Toolkit** — global state (auth)
- **React Hook Form** + **Zod** — form validation
- **React Router** — client-side routing
- **Axios** — API client with JWT refresh

## Getting Started

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App runs at **http://localhost:3000**. API proxy targets `http://localhost:8000`.

## Project Structure

```
src/
├── components/
│   ├── auth/          # ProtectedRoute, GuestRoute
│   ├── layout/        # DashboardLayout
│   └── ui/            # Shadcn UI primitives
├── hooks/             # Redux typed hooks
├── lib/               # API client, utils
├── pages/
│   ├── admin/         # Admin panel
│   ├── auth/          # Login, Register
│   ├── instructor/    # Instructor dashboard
│   ├── public/        # Landing, course catalog
│   └── student/       # Student dashboard
├── routes/            # Route definitions
├── services/          # API service layer
├── store/             # Redux store + slices
└── types/             # TypeScript interfaces
```

## Modules

| Role       | Routes                          | Features                                      |
|------------|---------------------------------|-----------------------------------------------|
| Student    | `/student/*`                    | Dashboard, course player, quizzes, certificates |
| Instructor | `/instructor/*`                 | Course wizard, students, Zoom live classes    |
| Admin      | `/admin/*`                      | User management, course approvals             |
| Public     | `/`, `/courses/:slug`           | Landing, catalog, course detail, auth         |

## Phase 2 Features

- **Course detail page** — `/courses/:slug` with enrollment CTA
- **Video learning** — `/student/courses/:courseId` with HTML5 player + progress tracking
- **Quiz engine** — multi-question flow with pass/fail results
- **Instructor course wizard** — 3-step create flow (info → lessons → review)
- **Live classes** — schedule Zoom sessions per course
- **Admin approvals** — approve/reject pending courses
- **Certificates** — list + PDF download
- **Notifications** — bell dropdown in dashboard header

## Next Steps

- Instructor analytics charts
- Admin reports & certificate management
- Password reset / email verification flows
- Video upload UI (file picker → backend storage)
- Real-time notifications (WebSocket)
