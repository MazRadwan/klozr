# KLOZR CRM

A modern, visually striking CRM dashboard built with Next.js 15, Tailwind CSS 4, TypeScript, and Shadcn UI. Designed for business professionals, KLOZR CRM combines a cutting-edge UI with robust customer and sales pipeline management.

![KLOZR Dashboard Screenshot](./public/screenshot.png)

---

## 🚀 Features
- **Modern Dashboard:** Responsive layout with ChatGPT-style sidebar, floating theme toggle, and animated business metrics cards.
- **KLOZR Branding:** Bold gradients, glassmorphism accents (optional), and a unique executive look.
- **Authentication:** Secure login with NextAuth.js v5.
- **Database:** Drizzle ORM (SQLite) for robust, type-safe data management.
- **Realtime & Async:** TanStack React Query for efficient data fetching and caching.
- **Animations:** Framer Motion for smooth transitions.
- **Drag & Drop:** React Beautiful DnD for pipeline management.
- **Validation & Testing:** Zod, Jest, and React Testing Library.

---

## 🛠️ Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS v4, Shadcn UI (Radix UI primitives)
- **TypeScript:** End-to-end type safety
- **ORM:** Drizzle (SQLite)
- **Auth:** NextAuth.js v5
- **State/Data:** TanStack React Query
- **Animation:** Framer Motion
- **Testing:** Jest, React Testing Library

---

## 📦 Getting Started

### 1. Install dependencies
```bash
npm install
# or
yarn install
```

### 2. Set up environment variables
Copy `.env.local.example` to `.env.local` and fill in required values (see [NextAuth.js docs](https://next-auth.js.org/)).

### 3. Run the development server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing
Run the test suite:
```bash
npm run test
```

---

## 📁 Folder Structure
- `src/app` — Next.js app directory
- `src/components` — UI and layout components
- `src/lib` — Utilities, types, and helpers
- `src/app/api` — API routes (Next.js)

---

## 🚀 Deployment
Deploy easily to your preferred platform. See deployment documentation for your chosen provider.

---

## 🤝 Contributing
Pull requests welcome! For major changes, please open an issue first to discuss what you’d like to change.

---

## 📜 License
[MIT](./LICENSE)
