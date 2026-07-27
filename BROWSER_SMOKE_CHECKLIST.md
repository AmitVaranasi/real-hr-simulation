# Browser Smoke Checklist (Iteration 4)

Run after auth or session changes. Confirm each step in **Chrome, Edge, Firefox, and Safari**.

## Auth

- [ ] Register a new student account
- [ ] Register a new instructor account
- [ ] Sign in as student → lands on `/dashboard`
- [ ] Sign in as instructor → lands on `/sessions`
- [ ] Sign out clears session; protected routes redirect to `/login`
- [ ] Forgot password sends email; reset link opens `/auth/reset-password`
- [ ] New password works on next sign-in
- [ ] Invalid credentials show a clear error (not a blank “Failed to Fetch”)
- [ ] With network blocked briefly, login shows a connection-friendly message

## Student round path

- [ ] Join team with code
- [ ] Dashboard shows current round / Continue Simulation
- [ ] Open decisions → save draft → Review & Submit → submit
- [ ] After instructor closes/computes, view results

## Instructor path

- [ ] Create session with round structure
- [ ] Create teams; open round; set economy
- [ ] Close & compute; open inspect / Testing Center
- [ ] View reports and release leaderboard
- [ ] Send student password reset from session tools (if student is enrolled)

## Notes

- Supabase Auth redirect URLs must include `{APP_URL}/auth/callback`
- `NEXT_PUBLIC_APP_URL` should match the deployed origin for reset emails
