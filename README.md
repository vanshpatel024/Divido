# Divido

## Overview
Divido is a real-time expense-sharing and trip-management application. The system solves the problem of managing shared expenses during group activities by providing real-time synchronization, accurate debt calculation, and participant tracking.

Within the system design, the domain terms "Trips" and "Stops" are modeled as flexible containers rather than literal travel milestones:
- **Trips**: Think of a "trip" as any shared chapter of time with your group. Whether it is a quick Friday dinner hangout, a spontaneous weekend road trip, or a month-long backpacking adventure, a trip binds your group together in a single shared space.
- **Stops**: These represent the individual moments, activities, or check-ins along the way where expenses are shared—like grab-and-go coffees, museum tickets, or group accommodation. They capture who paid and how the cost splits among the participants.

Core functionality includes trip creation, invitation management, real-time expense logging (stops), and automated optimal debt settlement calculation.

## Architecture
The system utilizes a two-tier architecture comprising a React Frontend and a Node.js/Express Backend, integrated with a Supabase (PostgreSQL) database.

- **Backend Tier**: Exposes a RESTful API for standard CRUD operations and authentication handshakes. An integrated WebSocket (`ws`) server shares the HTTP server port to handle publish/subscribe real-time event broadcasting.
- **Frontend Tier**: A single-page application utilizing React, Vite, and React Router. Context API manages Authentication state, while custom hooks (`useRealtimeTrip`, `useRealtimeDashboard`) manage WebSocket connections and coordinate auto-refetching.

**Data Flow Pipeline**:
1. Client sends HTTP POST/PUT (e.g., adding an expense) with a JWT.
2. Express controller validates the payload via Zod and extracts the User ID from the JWT via Supabase Auth.
3. The Service layer performs transactional inserts to the Supabase Database via `supabase-js`.
4. Upon successful database mutation, the controller triggers the WebSocket Manager.
5. The WebSocket Manager broadcasts event payloads (`stop_created`, `trip_ended`) to specific "Rooms" (e.g., trip rooms or user-specific dashboard rooms).
6. Subscribed clients receive the WS event and trigger an `onUpdate` callback to refetch updated state via the REST API.

## Tech Stack
- **Languages**: TypeScript, HTML, CSS
- **Frontend**: React 19, Vite, Tailwind CSS (v4), Framer Motion, React Three Fiber/Drei, React Router
- **Backend**: Node.js, Express, `ws` (WebSockets), Zod
- **Database & Auth**: Supabase (PostgreSQL, Supabase Auth)

## Features
- **Real-time Event Synchronization**: Implements a custom pub/sub room architecture over WebSockets. Clients subscribe to specific Trip IDs or personal Dashboard rooms to receive instant state invalidation signals.
- **Automated Debt Settlement Algorithm**: Calculates net balances from individual payments and expected shares, partitioning participants into creditors and debtors to compute optimal peer-to-peer settlement transactions.
- **Secure WebSocket Handshake**: WebSocket connections are secured via a first-message handshake containing a Supabase JWT. The server assigns a 10-second timeout, forcibly terminating unauthenticated connections.

## Folder Structure
```bash
Divido/
├── Backend/
│   ├── src/
│   │   ├── config/      # Environment variables and Supabase client initialization
│   │   ├── controllers/ # HTTP route handlers orchestrating services and WS broadcasts
│   │   ├── middleware/  # Express middlewares (Auth, Error handling)
│   │   ├── routes/      # Express route definitions
│   │   ├── services/    # Core business logic, DB interactions, and settlement algorithms
│   │   └── ws/          # WebSocket server and room-based pub/sub manager
│   ├── index.ts         # Server entry point (HTTP + WS binding)
│   └── package.json
└── Frontend/
    ├── src/
    │   ├── components/  # React UI components (Dashboard, Modals, Cards)
    │   ├── context/     # React Context providers (AuthContext)
    │   ├── hooks/       # Custom hooks (useRealtimeTrip, useRealtimeDashboard)
    │   ├── App.tsx      # Main application routing and providers
    │   └── main.tsx     # React DOM rendering
    ├── vite.config.ts   # Vite bundler configuration
    └── package.json
```

## How It Works
- **Request Lifecycle**: 
  - Standard operations hit REST API endpoints.
  - Zod schemas validate the request body.
  - The Supabase client executes CRUD operations.
  - WebSockets push light notification payloads containing event types and entity IDs.
  - Clients react to WS events by invalidating local state and re-fetching the full entity via REST, avoiding complex state merging on the client.
- **WebSocket Lifecycle**:
  - Client connects to `/ws` with an exponential backoff retry mechanism.
  - Client has 10 seconds to send an `auth` message containing the JWT.
  - Server verifies the JWT via Supabase. If valid, it binds the connection to the User ID.
  - Client sends `subscribe` messages for specific Trip IDs.
  - Server verifies participant authorization against the database before adding the connection to the Trip Room.
  - A periodic heartbeat (ping/pong) runs every 25s to detect and terminate stale connections, preventing memory leaks.

## Key Implementation Details
- **Settlement Algorithm (`TripService.getTripDebts`)**: 
  - Iterates through all trip "stops" to aggregate total payments (credits) and total split shares (debits) per user.
  - Calculates the net balance for each user.
  - Partitions users into `debtors` (negative net balance) and `creditors` (positive net balance).
  - Utilizes a greedy two-pointer approach, matching the highest debtors with the highest creditors to generate the minimal number of peer-to-peer repayment transactions.
- **Security & Concurrency**: 
  - WebSocket authentication is handled in the message payload rather than URL parameters to prevent token leakage in server access logs.
  - Guard clauses in the invitation service prevent duplicate database insertions from concurrent client requests.
- **Performance Considerations**:
  - WebSockets only transmit invalidation signals rather than full data payloads, keeping message sizes minimal.
  - Database queries use targeted `select` statements to avoid over-fetching relationship data.

## Setup & Installation
```bash
# Clone the repository
git clone <repository_url>
cd Divido

# Setup Backend
cd Backend
npm install
npm run dev

# Setup Frontend
cd ../Frontend
npm install
npm run dev
```

## Usage
1. Configure environment variables in `Backend/.env` (Supabase URL and Keys).
2. Start the Backend server (runs on port 3000 by default).
3. Start the Frontend development server.
4. Create an account, initiate a trip, and invite users.
5. Add stops (expenses) by specifying total amounts, who paid, and who is splitting the cost.
6. The system will automatically calculate the optimal settlement debts.