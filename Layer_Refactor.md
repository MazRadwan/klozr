# Final Architecture & Code-Quality Audit  
This summary consolidates all findings from the two earlier audits and my own inspection of the repository.

--------------------------------------------------------------------
CORE DIAGNOSIS  
--------------------------------------------------------------------
1. **Tight coupling of HTTP handlers and domain logic**  
   • Each route file mixes request parsing, auth, validation, business rules, database calls, and response formatting.  
   • Consequences: difficult unit testing, code duplication, and limited reuse outside Next.js.

2. **Absence of clear Service / Repository layers**  
   • Queries are built inline with Drizzle in every route.  
   • Lead-inheritance and other rules are duplicated across contacts, companies, and deals.

3. **Error-handling inconsistency**  
   • Some handlers lack `try/catch`; others use differing shapes (`{ error }`, `{ error, message }`, `{ error, details }`).  
   • No central error mapper or reusable HTTP error helper.

4. **Validation scatter & drift risk**  
   • Zod schemas (`contactSchema`, `companySchema`, `dealSchema`, …) live inside route files.  
   • Cross-entity validations (e.g., lead inheritance constraints) are ad-hoc, not enforced centrally.

5. **Ad-hoc transaction usage**  
   • Only the company-creation flow wraps related operations in `db.transaction`, despite similar multi-entity updates elsewhere (e.g., lead sync between contacts & companies).

6. **Query & join duplication**  
   • Identical `select` / `leftJoin` blocks recur across multiple routes.  
   • Search filters (`like`, `or`) are copy-pasted.

7. **Business rules hidden in “utility” modules**  
   • `leadUtils.ts` implements server-side rules yet is imported by client UI code (and duplicated again in APIs).  
   • Risk of divergent behaviour between server and client updates.

8. **Hard-coded singleton dependencies**  
   • All code imports a global `db` instance; other collaborators are pulled in via top-level imports rather than constructor arguments—limiting testability.

9. **Potential data-consistency gaps**  
   • Lead status & type need bi-directional sync across contacts, companies, and deals, but updates occur in isolated routes without guaranteed atomicity or re-validation.

--------------------------------------------------------------------
RECOMMENDATIONS (PRIORITISED ROADMAP)  
--------------------------------------------------------------------
Phase 1 — Immediate Wins (minimal churn)  
------------------------------------------------
A. **Repository Layer Extraction**  
   • Create lightweight repository classes (`ContactRepository`, `CompanyRepository`, etc.) consolidating Drizzle queries and joins.  
   • Route files will call repositories instead of writing SQL.  
   • Benefit: eliminates query duplication instantly; keeps diff small.

B. **Canonical Error Utility**  
   • Introduce `src/server/lib/httpError.ts` exporting helpers like `badRequest`, `unauthorized`, `internal`, each returning `{ error: code, message }`.  
   • Middleware (or a wrapper function) can catch thrown `AppError` instances and translate to uniform JSON.

Phase 2 — Service Layer & Business Logic  
------------------------------------------------
C. **Service Classes with Constructor Injection**  
   • Example:  
     ```ts
     export class ContactService {
       constructor(
         private readonly contacts: ContactRepository,
         private readonly companies: CompanyRepository,
         private readonly leadSync: LeadSyncService
       ) {}
       async create(data: CreateContactInput) { … }
     }
     ```  
   • Move lead-inheritance, validation orchestration, and transaction coordination here.

D. **Shared Validation Schemas**  
   • Move Zod objects to `src/server/validation/` and export typed helpers (`parseContactInput`).  
   • Services consume these; routes never touch Zod directly.

E. **Transaction-aware LeadSyncService**  
   • Centralise the rules that keep contacts ↔ companies ↔ deals in sync, ensuring updates occur inside the caller’s transaction.

Phase 3 — Cross-cutting Concerns & DX  
------------------------------------------------
F. **Error-handling Middleware / Higher-order Handler**  
   • A wrapper like `withHandler((req) => …)` that automatically:  
     1. runs `requireAuth` (when flagged),  
     2. transforms thrown `AppError`s to JSON,  
     3. catches unhandled exceptions → `500`.

G. **Dependency Injection Light**  
   • Stick to constructor injection plus provider functions (`makeContactService(db)`); no need for full IoC container yet.

H. **Unit & Integration Tests**  
   • With repositories and services isolated, add Jest / Vitest test suites:  
     – Repository tests run against an in-memory SQLite DB.  
     – Service tests mock repositories to assert business rules.

Phase 4 — Polish & Scaling  
------------------------------------------------
I. **Background Jobs / Domain Events**  
   • As the system grows, long-running operations (e.g., bulk lead conversions) can be handled via a queue; repositories should already abstract persistence to ease this transition.

J. **Type-safe Client SDK**  
   • Generate a thin client that calls the API and shares DTO types (zod-inferred) with the server, preventing shape drift.

--------------------------------------------------------------------
CHECKLIST FOR EACH ROUTE DURING MIGRATION  
--------------------------------------------------------------------
☑ Replace inline Drizzle code with repository call  
☑ Replace inline Zod parse with `validation/*.ts` helper  
☑ Wrap handler in `withHandler` (auth + error mapping)  
☑ Delegate business rules to appropriate service methods  
☑ Ensure multi-entity operations call `db.transaction(...)` via repository or service

--------------------------------------------------------------------
EXPECTED GAINS  
--------------------------------------------------------------------
• 70-80 % reduction in duplicate SQL snippets  
• Uniform error responses → simpler front-end handling  
• Business rules live in one place → easier maintenance and audits  
• Pure unit tests can target services without spinning up Next.js  
• Swappable persistence layer (Drizzle → Postgres, etc.) via repositories  
• Safer concurrent updates thanks to explicit transaction boundaries

--------------------------------------------------------------------
NEXT ACTION  
--------------------------------------------------------------------
Incremental Refactor Checklist  
( each stage can be merged & tested independently of the others)

──────────────────────────────────────────  
STAGE 0 – Groundwork  
──────────────────────────────────────────  
□ Create `src/server` folder with sub-folders:  
   • `repositories/` • `services/` • `validation/` • `lib/` (error helpers)  
□ Add a single `index.ts` barrel file in each sub-folder (`repositories/index.ts`, …).  
   → Keeps import paths flat and prevents circular references.  
□ Write a tiny HTTP-error helper, e.g. `lib/httpError.ts` with `badRequest`, `notFound`, `internal`.

──────────────────────────────────────────  
STAGE 1 – Repository Layer Extraction (Read-only queries)  
──────────────────────────────────────────  
1️⃣  Choose one easy route (Contacts GET) as the pilot.  
□ Create `ContactRepository` with methods:  
   • `findAll()` • `findByCompany(companyId)` • `search(term)`  
   (copy existing Drizzle queries verbatim).  
□ Update `src/app/api/contacts/route.ts#GET` to call the repo.  
□ Run tests / manual smoke test.  
2️⃣  Repeat for Companies GET and Deals GET.  
3️⃣  Delete duplicated SQL from route files once each method is migrated.  

──────────────────────────────────────────  
STAGE 2 – Validation Centralisation  
──────────────────────────────────────────  
□ Move existing Zod objects into `validation/contact.ts`, `validation/company.ts`, etc.  
□ Export helpers `parseContactInput(data)` that wrap `schema.parse`.  
□ Replace inline `schema.parse` calls in all routes touched so far.  

──────────────────────────────────────────  
STAGE 3 – Write-queries & Transactions  
──────────────────────────────────────────  
□ Add `create`, `update`, `delete` methods to each repository.  
□ For Company POST route, move its current transaction logic into `CompanyService.createWithContactAssignment`.  
□ Service calls repos inside `db.transaction(async (tx) => …)`.  
□ Route's POST becomes:  
   ```ts
   const company = await companyService.createWithContactAssignment(body)
   return NextResponse.json(company, { status: 201 })
   ```  
□ Repeat for Contact POST and Deal POST (transactions if multi-entity).  

──────────────────────────────────────────  
STAGE 4 – Lead Sync Service  
──────────────────────────────────────────  
□ Create `LeadSyncService` to encapsulate bi-directional rules.  
□ Inject it into `ContactService` and `CompanyService`.  
□ Move duplicated inheritance logic out of routes and utilities into this service.  
□ Delete now-unused code from `leadUtils.ts` (keep only UI helpers).

──────────────────────────────────────────  
STAGE 5 – Error-handling Wrapper  
──────────────────────────────────────────  
□ Add `withHandler({ auth?: boolean }, fn)` higher-order helper that:  
   • Runs `requireAuth` if flagged.  
   • Catches thrown `AppError` and maps to JSON via `httpError.ts`.  
   • Catches unknown errors → 500.  
□ Apply to all migrated routes.  

──────────────────────────────────────────  
STAGE 6 – Dependency Injection Lite  
──────────────────────────────────────────  
□ Create factory functions `makeContactService(db)` etc. that pass repositories to service constructors.  
□ Import these factories in each route instead of importing global instances.  
□ For testing, expose the constructors so tests can inject mocks.

──────────────────────────────────────────  
STAGE 7 – Cleanup & Tests  
──────────────────────────────────────────  
□ Delete any leftover duplicated SQL or validation.  
□ Write unit tests for repositories (in-memory SQLite) and services (mock repos).  
□ Maintain 100 % pass rate on existing end-to-end tests / manual checks after each stage.

Follow the stages in order; each completes a cohesive slice of work and leaves the application functioning.