import test from 'node:test';
import assert from 'node:assert/strict';
import ejs from 'ejs';
import app from '../app.js';
import { countries } from '../countries.js';

test('empty map renders without accessing a missing country path', async () => {
  const html = await ejs.renderFile('views/index.ejs', { users: [], currentUserId: undefined, countries: [], total: 0, color: 'teal', error: '', catalog: countries });
  assert.match(html, /Add your first family member/);
  assert.match(html, /Total Countries: 0/);
  assert.match(html, /if \(path\)/);
  assert.equal(new Set(countries.map((c) => c.code)).size, countries.length);
  assert.ok(countries.some((c) => c.code === 'ZA' && c.name === 'South Africa'));
});

test('member validation, cross-site protection and assets work over HTTP', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const invalid = await fetch(`${base}/new`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'name=&color=invalid' });
    assert.equal(invalid.status, 400);
    assert.match(await invalid.text(), /Enter a name/);
    const form = await fetch(`${base}/user`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'add=new' });
    assert.equal(form.status, 200);
    assert.match(await form.text(), /Add a Family Member/);
    const blocked = await fetch(`${base}/new`, { method: 'POST', headers: { 'sec-fetch-site': 'cross-site' }, body: '' });
    assert.equal(blocked.status, 403);
    const css = await fetch(`${base}/styles/main.css`);
    assert.equal(css.status, 200);
    assert.match(css.headers.get('content-type'), /text\/css/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});


test('Netlify adapter handles rewritten and direct function URLs', async () => {
  const { handler } = await import('../netlify/functions/app.mts');
  for (const path of ['/new', '/.netlify/functions/app/new']) {
    const result = await handler({
      httpMethod: 'POST', path,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'name=&color=invalid', isBase64Encoded: false,
      requestContext: { identity: {} },
    }, {});
    assert.equal(result.statusCode, 400);
    assert.match(result.body, /Enter a name/);
  }
});
