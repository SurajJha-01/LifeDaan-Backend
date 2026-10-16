# LifeDaan Backend

LifeDaan is a blood donation and medical connectivity platform designed to connect donors, hospitals, and people who need blood.

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- Socket.IO

## API Routes

| Route | Purpose |
|---|---|
| `/api/auth` | Authentication routes |
| `/api/inventory` | Inventory management |
| `/api/requests` | Blood request management |
| `/api/hospitals` | Hospital-related routes |
| `/api/camps` | Donation camp management |

## Project Structure

```text
backend/
├── models/
├── routes/
├── .gitignore
├── package.json
├── package-lock.json
└── server.js
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/SurajJha-01/LifeDaan-Backend.git
cd LifeDaan-Backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret
```

Replace the example values with your own configuration. Keep `.env` private and never commit database credentials or secrets to GitHub.

### 4. Run the server

```bash
npm start
```

By default, the server uses port `5000`, unless another port is configured through the `PORT` environment variable.

### 5. Test the server1

Open `http://localhost:5000` in your browser. The default route should display:

`LifeDaan Backend is Running...`

## Frontend Repository

[LifeDaan-Frontend](https://github.com/SurajJha-01/LifeDaan-Frontend)

## Author

Suraj Kumar Jha
