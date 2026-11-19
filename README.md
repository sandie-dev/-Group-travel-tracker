# Group Travel Tracker

An Express and EJS travel journal with a world map, family-member colors, and a visited-country count.

## Run locally

Use Node.js 22.12 or later in the 22.x release line (`nvm use` selects Node 22).

```sh
npm ci
netlify dev --port 8889
```

Netlify Dev supplies the managed database connection. `npm start` runs Express directly on port 3000 (or `PORT`) when a Netlify database connection is available in the environment.

```sh
npm test
```

## Netlify deployment

The site uses Node.js 22, serves assets from `public`, and routes page requests to the Express app in a Netlify Function. The database is managed by Netlify with Drizzle; schema definitions live in `db/schema.ts` and generated migrations live in `netlify/database/migrations`. Netlify applies migrations during deployment. No manual table creation or country-data import is needed.

Start by adding a family member, choose their color, and enter a country name from the suggestions or its two-letter map code. Each member can visit each country once. The selected member is remembered separately in each browser.

This is a shared tracker: family members are profiles, not authenticated accounts. All visitors can view and add members and visits. Existing records in a separately hosted PostgreSQL database are not imported automatically.

After editing the database schema, generate a migration:

```sh
npx drizzle-kit generate --name describe_schema_change
```

## Author

Sandile Mahlangu
