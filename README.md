# Expense Tracker

**[Live Demo](https://expense-tracker-ah.vercel.app)** &nbsp;|&nbsp; **[GitHub](https://github.com/ahenderson316/expense-tracker)**

A full-stack expense tracking application built with **Node.js**, **Express**, and **vanilla JavaScript**, with visual charts powered by **Chart.js**.

## Features

- Add, edit, and delete expenses
- Category tagging (Food, Transport, Housing, Entertainment, Health, Shopping, Other)
- Filter by category and month
- Summary cards: total spent, monthly total, transaction count, average
- Donut chart: spending breakdown by category
- Bar chart: 6-month spending trend
- Persistent storage via JSON file
- Clean dark-themed responsive UI

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Chart.js
- **Backend:** Node.js, Express
- **Storage:** JSON file (easily swappable for SQLite or MongoDB)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/expense-tracker.git
cd expense-tracker

# Install dependencies
npm install

# Start the server
npm start
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

For development with auto-reload:

```bash
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | Get all expenses (supports `?category=` and `?month=YYYY-MM`) |
| POST | `/api/expenses` | Create a new expense |
| PUT | `/api/expenses/:id` | Update an expense |
| DELETE | `/api/expenses/:id` | Delete an expense |
| GET | `/api/expenses/summary` | Get totals by category |

## Project Structure

```
expense-tracker/
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── server.js
├── expenses.json        (auto-created on first run)
├── package.json
└── README.md
```

## License

MIT
