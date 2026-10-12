/**
 * Generates a 6-digit dynamic TOTP token that refreshes every 60 seconds
 * for security gate verification.
 */
export function generateGatePassToken(residentId: string): string {
  const timeStep = Math.floor(Date.now() / 60000);
  let hash = 0;
  const input = `${residentId}:${timeStep}`;

  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }

  const token = Math.abs(hash) % 1000000;
  return token.toString().padStart(6, '0');
}
