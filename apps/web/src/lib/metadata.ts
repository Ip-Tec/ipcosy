import { headers } from "next/headers";

export interface DeviceInfo {
  deviceType: string; // "Mobile", "Desktop", "Tablet"
  deviceOS: string; // "iOS", "Android", "Windows", etc.
  browser: string; // "Chrome", "Safari", "Firefox"
}

export interface LocationInfo {
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface MessageMetadata {
  // Premium visible
  deviceType: string;
  deviceOS: string;
  browser: string;
  city: string;
  country: string;

  // Admin only
  ipAddress: string;
  latitude?: number;
  longitude?: number;
  deviceId?: string;
  browserFingerprint?: string;
  userAgent: string;
}

/**
 * Extract device information from User-Agent string
 */
export function extractDeviceInfo(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();

  // Detect device type
  let deviceType = "Desktop";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    deviceType = "Tablet";
  } else if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      userAgent,
    )
  ) {
    deviceType = "Mobile";
  }

  // Detect OS
  let deviceOS = "Unknown";
  if (/windows phone/i.test(ua)) deviceOS = "Windows Phone";
  else if (/android/i.test(ua)) deviceOS = "Android";
  else if (/ipad|iphone|ipod/i.test(ua)) deviceOS = "iOS";
  else if (/mac os x/i.test(ua)) deviceOS = "macOS";
  else if (/windows/i.test(ua)) deviceOS = "Windows";
  else if (/linux/i.test(ua)) deviceOS = "Linux";

  // Detect browser
  let browser = "Unknown";
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome|chromium|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";
  else if (/opr\//i.test(ua)) browser = "Opera";

  return { deviceType, deviceOS, browser };
}

/**
 * Get location from IP address using ipapi.co (free tier: 1000 requests/day)
 */
export async function getLocationFromIP(ip: string): Promise<LocationInfo> {
  try {
    // Skip for localhost/private IPs
    if (
      ip === "::1" ||
      ip === "127.0.0.1" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.")
    ) {
      return {
        city: "Local",
        country: "Local",
      };
    }

    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { "User-Agent": "IPCosy/1.0" },
    });

    if (!response.ok) {
      throw new Error("Geolocation API failed");
    }

    const data = await response.json();

    return {
      city: data.city || "Unknown",
      country: data.country_name || "Unknown",
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch (error) {
    console.error("Geolocation error:", error);
    return {
      city: "Unknown",
      country: "Unknown",
    };
  }
}

/**
 * Generate a simple device fingerprint from request headers
 */
export function generateDeviceFingerprint(
  userAgent: string,
  acceptLanguage: string,
  acceptEncoding: string,
): string {
  const data = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  // Simple hash function (for production, use crypto.subtle.digest)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get client IP address from request headers
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers();

  // Check various headers in order of preference
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = headersList.get("x-real-ip");
  if (realIP) return realIP;

  const cfConnectingIP = headersList.get("cf-connecting-ip"); // Cloudflare
  if (cfConnectingIP) return cfConnectingIP;

  return "unknown";
}

/**
 * Capture all metadata from current request
 */
export async function captureMessageMetadata(): Promise<MessageMetadata> {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "Unknown";
  const acceptLanguage = headersList.get("accept-language") || "";
  const acceptEncoding = headersList.get("accept-encoding") || "";

  const deviceInfo = extractDeviceInfo(userAgent);
  const ipAddress = await getClientIP();
  const location = await getLocationFromIP(ipAddress);
  const deviceId = generateDeviceFingerprint(
    userAgent,
    acceptLanguage,
    acceptEncoding,
  );

  return {
    // Premium visible
    deviceType: deviceInfo.deviceType,
    deviceOS: deviceInfo.deviceOS,
    browser: deviceInfo.browser,
    city: location.city,
    country: location.country,

    // Admin only
    ipAddress,
    latitude: location.latitude,
    longitude: location.longitude,
    deviceId,
    browserFingerprint: JSON.stringify({
      userAgent,
      language: acceptLanguage,
      encoding: acceptEncoding,
    }),
    userAgent,
  };
}

/**
 * Filter metadata based on user permissions
 */
export function sanitizeMetadataForUser(
  metadata: MessageMetadata,
  isPremium: boolean,
  isAdmin: boolean,
): Partial<MessageMetadata> {
  if (isAdmin) {
    // Admins see everything
    return metadata;
  }

  if (isPremium) {
    // Premium users see general context only
    return {
      deviceType: metadata.deviceType,
      deviceOS: metadata.deviceOS,
      browser: metadata.browser,
      city: metadata.city,
      country: metadata.country,
    };
  }

  // Regular users see nothing (maintains anonymity)
  return {};
}
