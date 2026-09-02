// Single shared-password protection for the whole site. No usernames, no
// accounts -- anyone with the password gets in. The password itself is
// never in code; it's set as a Cloudflare secret (env.SITE_PASSWORD).
export function checkAuth(request, env) {
  // If no password has been configured, don't lock anyone out --
  // this keeps local dev and a not-yet-configured deployment working.
  if (!env.SITE_PASSWORD) return true;

  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Basic ")) return false;

  let decoded;
  try {
    decoded = atob(auth.slice(6));
  } catch (err) {
    return false;
  }
  // Format is "username:password" -- username is ignored entirely, and the
  // password may itself contain a colon, so only split on the first one.
  const idx = decoded.indexOf(":");
  const password = idx === -1 ? decoded : decoded.slice(idx + 1);
  return password === env.SITE_PASSWORD;
}

export function unauthorizedResponse() {
  return new Response("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="UCC128 Tracker"' },
  });
}
