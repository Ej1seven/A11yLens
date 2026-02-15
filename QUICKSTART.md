# Quick Start

## 1. Install

```bash
npm install
```

## 2. Configure env

```bash
cp .env.example .env
```

Default `.env` works locally with SQLite.

## 3. Initialize DB

```bash
npx prisma db push
```

## 4. Start app

```bash
npm run dev
```

Open `http://localhost:3000`.

## 5. First run checklist

1. Register a new account on `/login`
2. Create a project from the home page
3. Add a site URL in the project page
4. Run scan and open results
5. (Optional) Invite a collaborator by email

## Helpful commands

```bash
npm run lint
npm run build
npx prisma studio
```
