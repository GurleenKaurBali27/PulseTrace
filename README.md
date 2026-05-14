# 🌀 PulseTrace | API Failure Visualizer

**PulseTrace** is a powerful, "cyber-luxe" dashboard designed to help developers watch their API traffic in real-time. Think of it as a "Security Camera" for your website's background communication. 

When your app talks to a database or another service and something goes wrong, PulseTrace catches it, visualizes it, and helps you fix it—all while keeping your sensitive data (like passwords and credit cards) safe and hidden.

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


