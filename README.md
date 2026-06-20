# Divido

Divido is a backend system for managing and splitting shared expenses within a trip. It allows users to create trips, add participants, record spending events (stops), and generate final settlement calculations to determine who owes whom.

## Overview

The system is designed to simplify shared expense management by automatically calculating net balances between participants based on all recorded transactions in a trip.

A trip consists of multiple participants and multiple stops. Each stop contains one or more transactions where participants record payments.

## Core Entities

### Trip
A trip is a container for a shared activity such as a vacation, outing, or event. It contains participants and stops.

### Participant
A participant is a user who is part of a trip and can make or share payments.

### Stop
A stop represents a spending event within a trip. Examples include meals, travel fares, accommodation, or any shared cost point.

A stop can contain multiple transactions.

### Transaction
A transaction represents a payment made by a participant within a stop.

Each transaction includes:
- paidBy (participant)
- amount

## How It Works

1. Users create a trip and add participants.
2. Users add stops to the trip.
3. Each stop records one or more transactions.
4. The system calculates the total amount paid and the total share for each participant.
5. Net balances are computed for each participant across all stops.
6. Final settlements are generated to minimize the number of transactions required to settle all balances.

## Settlement Logic

- Each participant's net balance is calculated as:
  net balance = total paid - total share
- Participants with a positive balance are creditors.
- Participants with a negative balance are debtors.
- The system matches debtors with creditors to minimize the number of transactions required to settle all balances.

## Design Notes

- Stops are used only for organizing transactions and do not affect settlement logic directly.
- All calculations are based on aggregated trip-level balances.
- Money values should be handled using integers (e.g., paise) to avoid floating-point errors.

## Future Scope

- Support for custom and percentage-based splits
- Partial settlements
- Real-time balance updates
- Analytics for spending patterns per trip
- Group-level permissions and roles

## Tech Stack (Suggested)

- Node.js with Express for backend
- MongoDB or PostgreSQL for database
- JWT for authentication
- REST API architecture

## License

This project is open-source and available under the MIT License.