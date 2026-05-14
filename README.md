# 🌀 PulseTrace | API Failure Visualizer

**PulseTrace** is a secure, real-time API failure visualizer designed to help developers monitor traffic and debug failures instantly. 

PulseTrace captures, visualizes, and helps resolve API issues while automatically masking sensitive data (PII) to ensure security and compliance.


---

## ✨ What does this project actually do? (The "Explain Like I'm Five" version)

Imagine you have a big factory. Usually, you can't see what's happening inside the pipes. If a pipe leaks, you only find out when the floor is wet.
*   **PulseTrace** puts transparent windows and sensors on all those pipes.
*   You can see exactly where the water (data) is flowing.
*   If a pipe breaks (an API error), a **Neon Pink** light flashes on your dashboard.
*   It also has a **Privacy Filter** that automatically blurs out secret stuff (like employee keys) so nobody can steal them just by looking at the dashboard.

---

## 🚀 Core Features

*   **⚡ Real-Time Monitoring**: Watch your API requests fly by as they happen.
*   **🛡️ Data Masking**: Automatically hides emails, passwords, and credit card numbers from the UI and Database.
*   **🔗 Distributed Tracing**: See the full journey of a request as it travels through different parts of your system.
*   **🔐 Security Audit Log**: A special ledger that records whenever an administrator tries to look at hidden sensitive data.
*   **🎨 Cyber-Luxe UI**: A stunning Dark + Light + Neon interface built for modern developers.

---

## 🛠️ The Tech Stack

We used modern, industry-standard tools to build PulseTrace:

### **Frontend (The Visuals)**
*   **React.js**: For building a fast, interactive user interface.
*   **Tailwind CSS v4**: For the custom "Cyber-Luxe" styling and neon effects.
*   **Framer Motion**: For smooth animations and glassmorphism transitions.
*   **Lucide React**: For beautiful, consistent iconography.

### **Backend (The Brains)**
*   **Node.js & Express**: The fast engine that handles all incoming data.
*   **Socket.io**: For the "Live" part—it pushes data to your screen instantly without refreshing.
*   **Sequelize ORM**: To talk to our database in a safe and structured way.
*   **Zod**: To make sure all the incoming data is shaped correctly and isn't "garbage."

### **Security & Database**
*   **SQLite / PostgreSQL**: Where all your logs are stored safely.
*   **Custom Masking Engine**: Our home-grown regex engine that redacts sensitive PII (Personally Identifiable Information).


---

## 📂 Project Structure

To keep things organized, PulseTrace is split into several focused directories:

*   **`client/`**: The React-based frontend. Contains the "Cyber-Luxe" dashboard, analytics charts, and real-time visualization components.
*   **`server/`**: The Node.js/Express backend. Handles data ingestion from trackers, manages the database, and powers the real-time Socket.io engine.
*   **`tracker/`**: A standalone, high-performance middleware package that you can drop into any Node.js app to start tracking failures.
*   **`docs/`**: The "Knowledge Hub." Contains detailed guides on security, setup, API references, and development phases.
*   **`scripts/`**: Automation tools for system verification, database migrations, and deployment readiness.
*   **`testAPI/`**: A playground/sample service used to demonstrate and test the tracker's capabilities.

---

## 📦 How to Run Locally


1.  **Clone the Repo**:
    ```bash
    git clone https://github.com/GurleenKaurBali27/PulseTrace.git
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Start the Engine**:
    ```bash
    npm run dev
    ```
    *   **Dashboard**: http://localhost:5173
    *   **Backend API**: http://localhost:5000

---

## 🔒 Security First
PulseTrace is built with **RBAC (Role-Based Access Control)**. 
*   **Admins** can see everything (but their actions are logged).
*   **Developers** can see metrics but not secret data.
*   **Viewers** can only see the high-level charts.

---


## 🤝 Contributing
Feel free to fork this project and add your own neon glow! 


