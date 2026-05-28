# ProPulse | Real-Time Collaborative Work Management & Analytics Platform

ProPulse is an enterprise-grade, highly-optimized **Real-Time Collaborative Kanban and Performance Analytics Platform** built to showcase production-level architectural expertise. 

This platform represents a modern SaaS workspace where users manage projects, drag-and-drop tasks in real-time, inspect team telemetry charts (burn-downs, velocity, workloads), trigger heavy async CSV exports, and monitor live activity audits.

---

## ⚡ Technical Architecture Layout

```
                  ┌───────────────────────────────────────────────┐
                  │          React Client (Vite + TS)             │
                  │   Tailwind Slate Glassmorphism / Recharts     │
                  └──────┬────────────────────────────────┬───────┘
                         │                                │
                    REST │ HTTP                      STOMP│ WebSocket
                         ▼                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Spring Boot Backend Mono                        │
│                                                                        │
│  ┌───────────────────────┐                  ┌───────────────────────┐  │
│  │   Spring Security     │                  │  WebSocket STOMP      │  │
│  │   Stateless JWT       │                  │  Secure Interceptor   │  │
│  └──────────┬────────────┘                  └──────────┬────────────┘  │
│             │                                          │               │
│             ▼                                          ▼               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Transactional Services                       │  │
│  │    Caffeine Caching / Decoupled Asynchronous Audit Log Events    │  │
│  └──────────┬──────────────────────────────────────────┬────────────┘  │
│             │                                          │               │
│             ▼                                          ▼               │
│  ┌───────────────────────┐                  ┌───────────────────────┐  │
│  │  JPA Data Repositories │                  │  Async File Exporter  │  │
│  │  Custom Shift Queries │                  │  @Async Report Engine │  │
│  └──────────┬────────────┘                  └──────────┬────────────┘  │
│             │                                          │               │
└─────────────┼──────────────────────────────────────────┼───────────────┘
              ▼                                          ▼
┌───────────────────────────┐              ┌───────────────────────────┐
│     H2 / PostgreSQL       │              │    Generated CSV File     │
│   Seed Data Seeded        │              │    reports/Report_*.csv   │
└───────────────────────────┘              └───────────────────────────┘
```

---

## 🛠️ Technology Stack & Core Design Mappings

### ☕ Backend (Spring Boot 3.4.x, Java 21 LTS)
1.  **State-of-the-Art Java 21**: Leveraging records for DTO structures, clean pattern matching, and Lombok utility classes.
2.  **Stateless Security with JWT**: Hand-crafted functional filter chains mapping to stateless JWT validations. Password hashing is configured via high-grade BCrypt encoders.
3.  **Secure WebSockets Handshake**: Live client communication using the STOMP messaging protocol. Connect requests are intercepted and authenticated using a **custom Channel Interceptor** checking token validity before granting socket threads.
4.  **Advanced JPA & Hibernate**: Built-in mitigations for N+1 query overheads, and custom transactional ordering algorithms utilizing shift queries (e.g., drag-and-drop board sorting).
5.  **Caffeine High-Speed Caching**: Annotating stats queries with `@Cacheable`. Employs automatic eviction callbacks (`@CacheEvict`) upon any task insertions, updates, movements, or deletions.
6.  **Background Processing & Scheduling**:
    *   `@Async` Thread Pooling for background compiling of report spreads without halting HTTP connections.
    *   `@Scheduled` Cron Engines aggregating nightly velocity performance checks.
    *   `ApplicationEventPublisher` decoupled event tracking, passing audit records asynchronously to secondary databases.

### ⚛️ Frontend (React 18+, TypeScript, Tailwind CSS, Recharts)
1.  **Vite Bundling**: Blazing fast hot module reloads, lightweight compiled builds.
2.  **Premium Glassmorphic Aesthetics**: Modern CSS tokens utilizing background filter blur overrides, deep slate-indigo harmonic scales, sleek inputs, and responsive flex grids.
3.  **HTML5 Native Drag & Drop**: Implemented in clean vanilla React without heavy 3rd-party node packages. Snippets manage transfer states and trigger instant optimistic UI updates.
4.  **WebSockets STOMP Hooks**: Robust STOMP subscription clients returning cleanup unsubscribe wrappers inside context layers.
5.  **Dynamic Telemetry Charts**: Powered by **Recharts**, presenting high-fidelity responsive analytics (burn-down velocity areas, user workload bars, and allocations).

---

## 🏃 Run Guide (Zero Configuration Required)

### 📌 Prerequisites
*   **Java Runtime**: JDK 21+ (Runs flawlessly on Java 21 through Java 26)
*   **Node.js**: Node 20+ and npm

---

### 1️⃣ Launching the Backend (Spring Boot)
Open your terminal and navigate to the backend folder:
```bash
cd backend
```

Use the Maven Wrapper script to clean, compile, and execute the boot runner:
```bash
# On Windows PowerShell
.\mvnw.cmd spring-boot:run

# On Linux or Mac OS
./mvnw spring-boot:run
```

*The backend will automatically start on port `8080` and seed the in-memory H2 database with demo users, tasks, and project listings.*

---

### 2️⃣ Launching the Frontend (React Vite)
Open a new terminal window and navigate to the frontend folder:
```bash
cd frontend
```

Install packages and boot the local Vite server:
```bash
npm install
npm run dev
```

*The frontend will mount on `http://localhost:5173`. Open this URL in your web browser!*

---

## 👥 Roster of Seeded Test Users

*All seeded accounts are configured with the password `password`.*

| Username | Email | Project Role (PROP) | Permission Scope |
| :--- | :--- | :--- | :--- |
| **`alex_admin`** | `admin@propulse.com` | **ADMIN** | Full rights, member provisioning |
| **`beatrice_mgr`** | `manager@propulse.com` | **MANAGER** | Edit rights, member additions |
| **`charlie_dev`** | `dev@propulse.com` | **CONTRIBUTOR** | Standard board task movement |
| **`diana_viewer`** | `viewer@propulse.com` | **VIEWER** | Read-only telemetry access |

---

## 🎯 Senior Engineer Interview Playbook (Talking Points)

Use these curated responses during technical interview rounds to demonstrate a senior-level understanding of full-stack engineering with Spring Boot:

### 💬 Question 1: "Tell me about a challenging backend feature you had to implement."
> 💡 **Your Response**: 
> *"A highly challenging and satisfying feature I built was the **dynamic relational task reordering algorithm** for our Kanban board. Most developers simply update the status column when a user drags a card, which leads to arbitrary card stacks when the page reloads. 
> 
> To solve this, I designed a transactional ordering index algorithm in my `TaskService`. When a task moves between columns, the database automatically shifts the indexes in both the source and destination columns to fill the gap and make room for the new card. This is managed via Spring Data JPA transactional methods, guaranteeing a synchronized, deterministic card stack across all concurrent user sessions."*

---

### 💬 Question 2: "How did you secure real-time WebSocket communication in your application?"
> 💡 **Your Response**: 
> *"Many systems leave WebSockets unauthenticated, which is a major security vulnerability. In ProPulse, I implemented a robust, stateless security wrapper by writing a **custom Channel Interceptor** in the `WebSocketConfig` routing.
> 
> When a client initializes a STOMP websocket handshake, the interceptor intercepts the `CONNECT` frame, extracts the JWT bearer token from the native handshake headers, verifies its signature with `JwtUtils`, loads the Spring Security `UserDetails`, and injects the authenticated Principal directly into the WebSocket header accessor. This ensures only authenticated project members can access board channels, and automatically supplies the authenticated user credentials into WebSocket handler methods."*

---

### 💬 Question 3: "How do you optimize heavy database metrics and telemetry from slowing down user requests?"
> 💡 **Your Response**: 
> *"Real-time charts require heavy statistical calculations (like grouping tasks by assignee and summing story weights), which can easily overload relational database caches. I optimized this by integrating **Caffeine In-Memory Caching** inside Spring Boot.
> 
> The dashboard statistics are annotated with `@Cacheable(value = "project-stats")`. When a user requests stats, it reads from a fast in-memory cache, bypassing the database entirely. To prevent stale data, I added `@CacheEvict(value = "project-stats")` inside my core Task controllers. Whenever a task is created, deleted, updated, or moved via HTTP or WebSockets, the cache is instantly cleared. The next read triggers a fast recalculation and repopulates the cache."*

---

### 💬 Question 4: "How do you handle heavy operations, like exporting large projects, without blocking the user interface?"
> 💡 **Your Response**: 
> *"For slow, processor-heavy operations like generating CSV spreadsheets or PDFs, I used Spring's **asynchronous thread executors** via the `@Async` annotation.
> 
> When a user clicks 'Export Tasks', the REST controller triggers `generateTaskReport` and immediately returns a `202 Accepted` status to the client, keeping the browser UI snappy. In the background, Spring hands the task over to a dedicated thread from the Task Executor pool to compile the database logs and write the CSV spreadsheet. Once done, the file is saved locally to the reports cache, demonstrating how to build non-blocking, responsive applications."*

---

### 💬 Question 5: "How do you decouple non-core business requirements (like audit logging) from your core transactional operations?"
> 💡 **Your Response**: 
> *"To prevent audit logs from delaying core database operations, I implemented an **asynchronous event-driven architecture** using Spring's `ApplicationEventPublisher`. 
> 
> When a user completes or moves a task, the service publishes a lightweight `AuditLogEvent`. Instead of writing the log synchronously, a decoupled `@EventListener` annotated with `@Async` catches the event in a background thread and persists the log in the audit history database. This completely detaches logging latency from the user's primary HTTP execution path."*
