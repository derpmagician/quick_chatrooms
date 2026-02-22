import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

/**
 * datos que metemos en el token
 * extendemos JWTPayload para que SignJWT nos acepte el objeto
 */
export interface JwtPayload extends JWTPayload {
  userId: string
  username?: string
  email?: string
}

const JWT_SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'default-secret'
)

export async function generateToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET_KEY)
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY)
    return payload as JwtPayload
  } catch {
    return null
  }
}