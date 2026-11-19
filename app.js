import express from 'express';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { getDb } from './db/index.ts';
import { users, visitedCountries } from './db/schema.ts';
import { countries as catalog } from './countries.js';

const app = express();
app.disable('x-powered-by');
app.set('views', path.resolve('views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false, limit: '8kb' }));
app.use(express.static(path.resolve('public')));
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (req.method === 'POST' && req.get('sec-fetch-site') === 'cross-site') return res.sendStatus(403);
  next();
});
const colors = new Set(['red', 'green', 'yellow', 'olive', 'orange', 'indigo', 'blue', 'violet', 'purple', 'pink', 'teal']);
const route = (handler) => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
function selectUser(req, res, id) {
  res.cookie('traveler', String(id), { httpOnly: true, sameSite: 'lax', secure: req.secure || req.get('x-forwarded-proto') === 'https', maxAge: 31536000000 });
}
async function currentUser(req) {
  const all = await getDb().select().from(users).orderBy(users.id);
  const id = Number(req.headers.cookie?.match(/(?:^|;\s*)traveler=(\d+)(?:;|$)/)?.[1]);
  return { all, user: all.find((u) => u.id === id) || all[0] };
}
async function renderTracker(req, res, error = '', status = 200) {
  const { all, user } = await currentUser(req);
  const visited = user ? await getDb().select().from(visitedCountries).where(eq(visitedCountries.userId, user.id)) : [];
  res.status(status).render('index', { users: all, currentUserId: user?.id, countries: visited.map((v) => v.countryCode), total: visited.length, color: user?.color || 'teal', error, catalog });
}
app.get('/', route((req, res) => renderTracker(req, res)));
app.post('/add', route(async (req, res) => {
  const { user } = await currentUser(req);
  if (!user) return renderTracker(req, res, 'Add a family member first.', 400);
  const input = typeof req.body.country === 'string' ? req.body.country.trim().toLowerCase() : '';
  const country = catalog.find((c) => c.name.toLowerCase() === input || c.code.toLowerCase() === input);
  if (!country) return renderTracker(req, res, 'Choose a country from the suggestions or enter its two-letter code.', 400);
  const added = await getDb().insert(visitedCountries).values({ userId: user.id, countryCode: country.code }).onConflictDoNothing().returning();
  if (!added.length) return renderTracker(req, res, 'This country is already on your map.', 409);
  res.redirect(303, '/');
}));
app.post('/user', route(async (req, res) => {
  if (req.body.add === 'new') return res.render('new', { error: '' });
  const { all } = await currentUser(req);
  const user = all.find((u) => u.id === Number(req.body.user));
  if (!user) return renderTracker(req, res, 'Choose an existing family member.', 400);
  selectUser(req, res, user.id);
  res.redirect(303, '/');
}));
app.post('/new', route(async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  if (!name || name.length > 60 || !colors.has(req.body.color)) return res.status(400).render('new', { error: 'Enter a name (up to 60 characters) and pick a color.' });
  const [user] = await getDb().insert(users).values({ name, color: req.body.color }).returning();
  selectUser(req, res, user.id);
  res.redirect(303, '/');
}));
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  res.status(503).render('error');
});
export default app;
