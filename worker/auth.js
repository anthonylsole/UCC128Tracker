// Single shared-password protection for the whole site. No usernames, no
// accounts -- anyone with the password gets in. The password itself is
// never in code; it's set as a Cloudflare secret (env.SITE_PASSWORD).
//
// Cloudflare has two different binding types that can end up in
// env.SITE_PASSWORD: a classic secret (a plain string) or a newer
// "Secrets Store" binding (an object requiring an async .get() call to
// retrieve the actual value). This resolves either shape transparently.
async function resolveSecret(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "string") return value;
  if (typeof value.get === "function") {
    try {
      return await value.get();
    } catch (err) {
      return undefined;
    }
  }
  return undefined;
}

export async function checkAuth(request, env) {
  const password = await resolveSecret(env.SITE_PASSWORD);
  // If no password has been configured, don't lock anyone out --
  // this keeps local dev and a not-yet-configured deployment working.
  if (!password) return true;

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
  const provided = idx === -1 ? decoded : decoded.slice(idx + 1);
  return provided === password;
}

export async function resolveSitePasswordForDiagnostics(env) {
  return await resolveSecret(env.SITE_PASSWORD);
}

export function unauthorizedResponse() {
  return new Response("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="UCC128 Tracker"' },
  });
}
