# ISAANTECH

A responsive YouTube tutorial showcase with a public library and an admin dashboard.

## Included
- Light, responsive design with a modern video-card homepage
- Search and category filters
- Embedded YouTube player modal
- Admin login using Supabase Auth
- Add, edit, publish/unpublish and delete tutorial records
- Netlify deployment configuration

## 1. Run locally
Install Node.js (LTS), then:

```bash
npm install
cp .env.example .env
npm run dev
```

The public site can run without Supabase using sample tutorials. Admin features require Supabase credentials.

## 2. Configure Supabase
1. Create a project at https://supabase.com.
2. In Project Settings > API, copy the Project URL and anon/public key into `.env`.
3. Open SQL Editor and run `supabase-schema.sql`.
4. In Authentication settings, disable public sign-ups.
5. In Authentication > Users, create your own admin user.
6. Use that email and password on `/admin`.

The SQL policies are restricted to the designated administrator only (User UID: `0b545fa3-70a6-45e5-8bee-66d20c89d3b8`). Public visitors can read published tutorials; only this administrator can view drafts and create, edit, publish/unpublish, or delete tutorials. The frontend also blocks other signed-in accounts from the dashboard. Never expose a Supabase service-role key in the frontend.

## 3. Deploy to Netlify
1. Push this project to a GitHub repository.
2. In Netlify, choose Add new site > Import an existing project and select the repository.
3. Build command: `npm run build`; publish directory: `dist` (also configured in `netlify.toml`).
4. In Site configuration > Environment variables, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Deploy the site.

## Notes
- YouTube videos are embedded using their video IDs. Use videos that allow embedding.
- The app uses sample content if Supabase is not configured; sample data is for preview only.
- This is a starter implementation. Before production launch, run the updated `supabase-schema.sql` in the Supabase SQL Editor, verify that the designated UID belongs to your admin account, and test public access plus admin-only database operations.
