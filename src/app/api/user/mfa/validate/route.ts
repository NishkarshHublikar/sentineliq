import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import * as OTPAuth from 'otpauth'
import clientPromise from '@/lib/mongodb'

export async function POST(req: Request) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { token } = await req.json()

  const client = await clientPromise
  const user = await client.db().collection('users').findOne({ email: session.user.email })

  if (!user || !user.mfaSecret) {
    return NextResponse.json({ error: 'MFA not setup' }, { status: 400 })
  }

  const totp = new OTPAuth.TOTP({
    issuer: 'SentinelIQ',
    label: session.user.email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: user.mfaSecret,
  })

  const delta = totp.validate({ token, window: 1 })

  if (delta === null) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
