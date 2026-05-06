import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import * as OTPAuth from 'otpauth'
import QRCode from 'qrcode'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST() {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Generate a new secret
  const secret = new OTPAuth.Secret({ size: 20 })
  const secretBase32 = secret.base32

  // Create the TOTP object
  const totp = new OTPAuth.TOTP({
    issuer: 'SentinelIQ',
    label: session.user.email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secretBase32,
  })

  const uri = totp.toString()
  const qrCode = await QRCode.toDataURL(uri)

  return NextResponse.json({
    secret: secretBase32,
    qrCode,
  })
}
