## IKB 2.0

IKB 2.0 is a modular warehouse and inventory management system, supporting tray management, barcode scanning, planogram tracking, and administrative dashboards.

## Monorepo Structure

- **admin-control-ui/** – Next.js admin dashboard for system configuration and monitoring.
- **frontend/** – Main React application for warehouse operations and tray management.
- **backend/** – Node.js/Express backend API for business logic, authentication, and printing.
- **api/** – Legacy or auxiliary Node.js/Express API endpoints.
- **apiv2/** – OpenAPI/Swagger-based experimental API.
- **ikbclient/** – Additional React client application.

## Features

- Tray and warehouse management
- Barcode scanning and validation
- Planogram (inventory layout) support
- Label printing (Zebra/ZPL)
- User authentication and roles
- Admin dashboard for configuration

## Technologies

- **Frontend:** React, Material-UI, Tailwind CSS, Next.js
- **Backend:** Node.js, Express, MySQL, JWT
- **Printing:** Zebra label printers (ZPL)
- **API:** REST, OpenAPI (Swagger)

## Getting Started

1. Clone the repository.
2. Install dependencies in each subproject (/frontend and /backend):
   ```sh
   npm install
   ```
3. Configure environment variables (`.env` files).
4. Start backend from /backend:
   ```sh
   npm run start:8000
   ```
5. Start frontend from /frontend:
   ```sh
   npm run build:prod
   ```
6. Access admin dashboard:
   ```sh
   npm run dev --prefix admin-control-ui
   ```

## Notable Files

- `frontend/src/component/wh/Wh.jsx` – Main warehouse UI logic
- `backend/api/scan.controller.js` – Core backend scan/print logic

## Required Environment Variables

Each subproject requires certain environment variables to be set. Below are the most important ones:

### Frontend (`frontend/.env`)

- `REACT_APP_BACKEND_HOST` – URL of the backend API server (e.g., `http://localhost:4500`)
- `REACT_APP_DEPLOYMENT_MODE` – Set to `"ADMIN"` or `"REGULAR"` to control app mode

### Backend (`backend/.env`)

- `port` – Port number for the backend server (e.g., `4500`)
- Database connection variables (if not hardcoded):
  - `DB_HOST`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`
- Any printer or external service configuration as needed

### Admin Control UI (`admin-control-ui/.env`)

- Add any required variables for Next.js admin dashboard (e.g., API URLs, secrets)

> See each subproject's `.env.example` or `.env` file for more details.

## License
MIT
