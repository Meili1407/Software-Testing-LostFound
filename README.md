# Software Testing Lost & Found

This project is a simplified Lost & Found system developed for the Software Testing course.

The project focuses on a smaller set of core business functions so that the system logic can be tested, analyzed, and documented clearly using different software testing techniques.

## Main Focus

* Lost item reports
* Found item reports
* Rule-based item matching
* Match score classification
* Ownership claim verification
* Staff claim decision workflow
* Test cases and testing documentation

## Testing Scope

The project focuses on testing these areas:

* Unit Testing
* Integration Testing
* Boundary Value Analysis
* Equivalence Partitioning
* Decision Table Testing
* Control Flow Graph Testing
* Data Flow Graph Testing
* Path Testing

## Matching Rules

The matching score uses a 100-point rule-based system:

| Attribute        | Points |
| ---------------- | -----: |
| Item name / type |     25 |
| Description      |     25 |
| Color            |     15 |
| Brand            |     15 |
| Location         |     10 |
| Date             |     10 |

Match levels:

| Score  | Result         |
| ------ | -------------- |
| 75-100 | Strong Match   |
| 50-74  | Possible Match |
| 0-49   | Weak Match     |

## User Roles

### Student

* Create lost item reports
* Search found items
* Submit ownership claims
* Provide evidence
* Check claim status

### Staff

* Create found item reports
* Review matching results
* Review ownership evidence
* Approve, reject, or request more information

## Out of Scope

This project does not focus on:

* Microsoft authentication
* Full JWT/RBAC implementation
* Gemini or AI matching
* Peer API integration
* Azure Key Vault
* Production deployment setup
* Full admin dashboard

## Tech Stack

* Node.js
* Express.js
* PostgreSQL
* Prisma ORM
* Zod

## Project Setup

Install dependencies:

```bash
npm install
```

Create an environment file:

```bash
cp .env.example .env
```

Validate the Prisma schema:

```bash
npm run prisma:validate
```

Run the database migration:

```bash
npm run prisma:migrate
```

Seed the database:

```bash
npm run prisma:seed
```

Start the development server:

```bash
npm run dev
```

## Repository Purpose

This repository contains the implementation and testing materials for the Software Testing Lost & Found project.

The goal is to develop a focused Lost & Found system with clearly defined and testable business logic. The project emphasizes rule-based item matching, ownership verification, claim processing, and the application of software testing techniques rather than building a full production-scale system.
