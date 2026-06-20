# Trip Expense Splitter

## Overview

Trip Expense Splitter is a full-stack web application designed to manage shared expenses between multiple users during a Trip. It allows users to create Trips, add Participants, record financial activities at different Stops, and automatically calculate final settlements between participants.

The system ensures accurate tracking of shared spending and simplifies the process of determining who owes whom at the end of a Trip.

---

## Core Concept

The application is built around three main entities:

### Trip
A Trip represents a shared financial context created by a group of users.

Examples:
- Mumbai Trip
- Night Out
- Goa Vacation
- Weekend Outing

A Trip acts as the parent container for all activity.

---

### Participants
Participants are users who are part of a Trip. They can:
- contribute payments
- be included in expense splits
- receive settlement calculations

Each Trip has its own independent set of Participants.

---

### Stops
A Stop represents a financial event within a Trip where money is spent.

Examples:
- Dinner
- Hotel booking
- Uber ride
- Movie tickets

A Stop may contain multiple payments made by different Participants.

Each Stop supports multiple Transactions.

---

### Transactions
A Transaction represents a payment made by a Participant within a Stop.

Example:
Stop: Dinner
- User A paid 300
- User B paid 200

---

## System Flow

1. A Trip is created.
2. Participants are added to the Trip.
3. Multiple Stops are created within the Trip.
4. Each Stop records Transactions made by Participants.
5. The system calculates total contributions and required shares per Participant.
6. Final net balances are computed for each Participant.
7. A settlement algorithm determines the minimum set of transactions required to settle all debts.

---

## Core Logic

- Each Stop contributes to the overall Trip balance.
- Stops are not treated as independent accounting units.
- All financial data is aggregated at the Trip level.
- Final settlement is based on net balances:
  - Positive balance indicates money to receive
  - Negative balance indicates money to pay

---

## Tech Stack

### Frontend
- React
- TypeScript
- Tailwind CSS

### Backend
- Node.js
- Express.js
- TypeScript

### Database & Authentication
- Supabase (PostgreSQL + Auth)

---

## Key Features

- Trip-based expense tracking
- Multiple Participants per Trip
- Multiple Stops per Trip
- Multiple Transactions per Stop
- Automatic balance calculation
- Optimized settlement generation
- Scalable backend architecture

---

## Settlement Strategy

The system calculates net balances for all Participants in a Trip and then applies a greedy algorithm to minimize the number of transactions required to settle all debts.

Steps:
1. Calculate total paid and total share per Participant
2. Compute net balance
3. Separate creditors and debtors
4. Match and settle balances optimally

---

## Design Principles

- Stops are used only for organizing transactions, not for settlement logic
- All calculations are performed at Trip level
- Money is handled using integer values (to avoid floating-point errors)
- Each Trip is independent and self-contained
- System is designed to support future extensions such as custom splits and partial settlements

---

## Future Improvements

- Real-time balance updates
- Custom split methods (percentage, exact amounts)
- Partial settlement tracking
- Notifications for payments
- Analytics for spending patterns per Trip