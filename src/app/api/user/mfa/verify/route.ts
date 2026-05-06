import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import * as OTPAuth from 'otpauth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(req: Request) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { token, secret } = await req.json()

  if (!token || !secret) {
    return NextResponse.json({ error: 'Missing token or secret' }, { status: 400 })
  }

  const totp = new OTPAuth.TOTP({
    issuer: 'SentinelIQ',
    label: session.user.email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  })

  const delta = totp.validate({ token, window: 1 })

  if (delta === null) {
    return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
  }

  // Save the secret and enable MFA in the database
  const client = await clientPromise
  const db = client.db()
  
  await db.collection('users').updateOne(
    { email: session.user.email },
    { $set: { mfaEnabled: true, mfaSecret: secret } }
  )

  return NextResponse.json({ success: true })
}
