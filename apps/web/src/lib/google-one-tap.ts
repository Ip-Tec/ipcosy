import { createRemoteJWKSet, jwtVerify } from "jose";
const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export async function verifyOneTapToken(credential: string, clientId: string, nonce: string) {
  const { payload } = await jwtVerify(credential, googleKeys, {
    audience: clientId, issuer: ["https://accounts.google.com", "accounts.google.com"], algorithms: ["RS256"],
    requiredClaims: ["exp", "iat", "sub", "aud", "iss"], clockTolerance: 5,
  });
  if (payload.nonce !== nonce || payload.email_verified !== true || typeof payload.email !== "string" || typeof payload.sub !== "string" || !payload.sub) throw new Error("Invalid Google identity");
  return { sub: payload.sub, email: payload.email.trim().toLowerCase(), name: typeof payload.name === "string" ? payload.name : null, image: typeof payload.picture === "string" ? payload.picture : null };
}
