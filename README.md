# ProjectNest

**ProjectNest** is a **TypeScript-based** project and task management system built with **Node.js**, **Express**, and **MongoDB**. It features a clean, modular architecture with role-based access control, project collaboration, team notes, and structured logging using **Winston**.

## Features

- **Project Management** (Create, update, delete projects)
- **Task & Subtask Management**
- **Team Collaboration**
- **Role-Based Access Control** (Owner, Project Manager, Member)
- **Zod Validation**
- **Centralized Error Handling**
- **Mongoose Aggregation Pipelines**
- **Winston Logging Integration**

## Technologies Used

- **Language:** TypeScript
- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB (via Mongoose)
- **Validation:** Zod
- **Authentication:** JWT-based
- **File Uploads:** Multer + Cloudinary
- **Mailing:** Nodemailer + Mailgen
- **Logging:** Winston

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/)
- Cloudinary credentials (for image upload)
- Email SMTP config (for mail services)

### Steps

1. Clone the repository:
   ```sh
   git clone https://github.com/akgbytes/project-nest
   cd project-nest
   ```
2. Install dependencies:

   ```sh
   npm install
   ```

3. Copy .env file:
   ```sh
   cp .env.example .env
   ```
4. Start the server:
   ```sh
   npm start
   ```

## Project Structure

```
/project-nest
│── logs/                  # Winston log files (error.log, combined.log)
│── public/
│   └── uploads/           # Temporary storage for uploaded files (via Multer)
│── src/
│   ├── controllers/       # Request handlers and business logic
│   ├── middleware/        # Express middleware (auth, error handler, etc.)
|   ├── models/            # Mongoose models (Project, User, Notes, etc.)
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions (CustomError, permissions)
|   ├── validators/        # Zod schemas and validation logic
|   ├── config/            # Configs for DB, cloudinary, logger, etc.
│   ├── types.d.ts         # Global/custom TypeScript declarations
│   ├── app.ts             # Express app setup (middlewares, routes)
│   ├── index.ts           # Entry point — starts server and connects to DB
├── .env.example           # Sample environment configuration
├── .gitignore             # Files and folders to exclude from Git
├── package.json           # Project dependencies and metadata
├── package-lock.json      # Lockfile for dependency versions
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project overview and documentation
```

## Contributing

Pull requests are welcome! Feel free to fork the repo and submit a PR.

## License

This project is open-source and available under the **ISC License**.
