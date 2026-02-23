# 🏗 System Architecture - Provento-Manager

This diagram represents the flow of data and user roles within the system.

```text
          +---------------------+
          |      👤 Gestor       |
          | (Admin - Full Access)|
          +---------------------+
                    │
                    ▼
+--------------------------------------+
|   🔑 User Authentication (Login)    |
|      - Email must be pre-registered |
|      - Accept LGPD Terms            |
+--------------------------------------+
                    │
                    ▼
  +--------------------------------+
  | 📤 Upload CSV/Excel for users  |
  | - Mentors & Consultants added  |
  +--------------------------------+
                    │
                    ▼
         +-------------------+
         |  🎯 Django Backend  |
         | - Handles requests |
         | - Business logic   |
         +-------------------+
                    │
                    ▼
         +-------------------+
         |  📊 SQLite Database |
         | - Stores users      |
         | - Saves mentorships |
         | - Tracks sessions   |
         +-------------------+
                    │
                    ▼
+--------------------------------+
|  📊 Automated Dashboards       |
| - Tracks company performance   |
| - Facilitators monitor growth  |
+--------------------------------+
                    │
                    ▼
+--------------------------------+
|  ☁️ Hosted on PythonAnywhere  |
| - Runs Django app              |
| - Provides web access          |
+--------------------------------+

