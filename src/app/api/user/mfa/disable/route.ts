import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import clientPromise from '@/lib/mongodb'

export async function POST() {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await clientPromise
  const db = client.db()
  
  await db.collection('users').updateOne(
    { email: session.user.email },
    { $set: { mfaEnabled: false, mfaSecret: null } }
  )

  return NextResponse.json({ success: true })
}
