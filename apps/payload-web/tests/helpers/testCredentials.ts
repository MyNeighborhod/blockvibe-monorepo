/** Superadmin credentials for admin.e2e (local seed or prod login). */
export function getSuperadminCredentials(): { email: string; password: string } | null {
  const email = process.env.TEST_USER_EMAIL || process.env.LOCAL_SUPERADMIN_USERNAME
  const password = process.env.TEST_USER_PASSWORD || process.env.LOCAL_SUPERADMIN_PASSWORD

  if (!email || !password) {
    return null
  }

  return { email, password }
}
