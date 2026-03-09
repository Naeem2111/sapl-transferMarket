# SAPL Transfer Market

A transfer market for the South African Pro Clubs League (SAPL). Players sign in with their LeagueRepublic Person ID or email, then can list themselves as available with preferred positions and leagues. Only **listed** players appear in the market.

## Features

- **LeagueRepublic data**: Person ID, name, email, teams, status, etc. (from PERSON export CSV).
- **Preferred positions**: ST, CAM, CM, etc.
- **Preferred leagues**: e.g. Super League Premiership, Championship, Champions League.
- **Listed flag**: A player is visible on the market only when they turn "Listed on transfer market" on in their profile.
- **Market privacy**: Listed players are shown by name and the info they filled in (positions, leagues, bio) only—no contact details on the market.
- **Captains**: Captains sign in with **email** (separate from players). They can **request a player to trial** (player sees the request in their dashboard and can accept/decline) or **contact via WhatsApp** (a wa.me link is shown only to signed-in captains; the player’s number is never displayed).

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. Import players from LeagueRepublic:
   - Export the Person list from LeagueRepublic as CSV (e.g. PERSON_3377.csv).
   - Open **Admin → Import** at `/admin/import` and upload the CSV.

4. (Optional) Configure Twilio for OTP SMS:
   - Create a [Twilio](https://www.twilio.com/) account and get Account SID, Auth Token, and a phone number.
   - Add to `.env`: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.
   - If these are not set, OTPs are logged to the server console (dev mode); you can use that code to complete registration.

5. Run the app:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Usage

- **Players**: Create an account with your **phone number** (dialing code + number; must match a number in the LeagueRepublic import). You’ll receive an **OTP by SMS** to confirm the number; then set a password. Edit your profile: preferred positions, leagues, and turn **Listed** on to appear in the market.
- **Market**: Browse at `/market`; filter by league or position. Only listed players are shown.
- **Admin**: Import a new or updated LeagueRepublic Person CSV at `/admin/import`.

## Tech

- Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS.
- SQLite + Prisma.
- Session via HTTP-only cookie (no NextAuth).
- Player registration OTP via Twilio SMS (or console in dev).
