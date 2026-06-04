export async function signIn(email: string, password: string) {
  const res = await fetch('/api/auth/sign-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return res.json()
}

export async function signUp(name: string, email: string, password: string) {
  const res = await fetch('/api/auth/sign-up', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  return res.json()
}

export async function signOut() {
  await fetch('/api/auth/sign-out', { method: 'POST' })
}

export async function getSession() {
  const res = await fetch('/api/auth/session')
  if (!res.ok) return null
  return res.json()
}
