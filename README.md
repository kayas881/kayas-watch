# Saral Watch | Web & Infrastructure Monitor

Saral Watch is a robust, multi-tenant SaaS-style web application built to monitor client websites, services, and APIs in real-time. By leveraging Uptime Kuma as its core monitoring engine, it offers a centralized, custom-built administrative dashboard for tracking uptime, managing incidents, and keeping an eye on your entire infrastructure.

## 🚀 Features

*   **Real-Time Monitoring:** Keep track of your websites and APIs with continuous HTTP, Ping, Port, Keyword, and DNS checks.
*   **Centralized Dashboard:** A sleek, intuitive overview of all clients, active monitors, and ongoing incidents in one unified interface.
*   **Incident Management:** Automated incident creation and tracking upon monitor failures, complete with severity levels and status updates.
*   **Multi-Tenancy:** Organize monitors and incidents by clients, making it easy to manage multiple distinct organizations.
*   **Uptime Kuma Integration:** Seamlessly syncs with Uptime Kuma for reliable, headless monitoring capabilities and instant webhook alerts.
*   **Status Pages:** Public or private status pages for transparency and communication during downtime.

## 📸 Screenshots

### Dashboard Overview
Get a high-level view of your entire infrastructure's health. Track total clients, monitor uptime percentages, site statuses, and immediately spot open incidents.

![Dashboard Overview](./public/images/dashboard.png)

### Incident Management
Track and manage monitor outages and degraded performance with detailed logs, allowing your team to respond to downtime effectively.

![Incidents View](./public/images/incidents.jpeg)

## 🛠️ Technology Stack

*   **Frontend & API:** Next.js (App Router), React, Tailwind CSS
*   **Database:** PostgreSQL with Prisma ORM
*   **Monitoring Engine:** Uptime Kuma (Headless)
*   **Authentication:** NextAuth.js
*   **Containerization:** Docker & Docker Compose

## 🏗️ Architecture

Saral Watch employs a modern monolithic architecture using Next.js for both the user interface and API routes.

1.  **Next.js Dashboard:** The main UI for managing clients, websites, monitors, and incidents.
2.  **Uptime Kuma (Engine):** Handles the actual polling and checks.
3.  **PostgreSQL Database:** Stores configuration, historical data, user accounts, and incident logs.
4.  **Webhook Integration:** When Uptime Kuma detects a state change (e.g., a site goes down), it sends a webhook to the Next.js app, which processes the event and manages incidents automatically based on configured retry policies.

For deeper insights, please refer to the [Architecture Document](architecture.md).

## 🚦 Getting Started

### Prerequisites

*   Docker and Docker Compose
*   Node.js (v18+)
*   npm or pnpm

### Local Development Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-org/saral-watch.git
    cd saral-watch
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file based on a `.env.example` (if provided) or configure database URLs and NextAuth secrets.
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/saralwatch"
    NEXTAUTH_SECRET="your_secret_here"
    NEXTAUTH_URL="http://localhost:3000"
    ```

4.  **Start Services (Database & Uptime Kuma):**
    ```bash
    docker-compose up -d
    ```

5.  **Initialize Database:**
    ```bash
    npm run build # Includes Prisma generate and db push
    # OR
    npx prisma db push
    npx prisma generate
    ```

6.  **Run the Development Server:**
    ```bash
    npm run dev &
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📄 License

This project is proprietary and intended for internal use.
