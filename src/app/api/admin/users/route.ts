import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import clientPromise from '@/lib/mongodb'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getServerSession()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await clientPromise
  const db = client.db()
  
  const users = await db.collection('users')
    .find({}, { projection: { password: 0, mfaSecret: 0 } })
    .toArray()

  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const session = await getServerSession()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, email, password, role } = await req.json()

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db()
  
  // Check if user already exists
  const existingUser = await db.collection('users').findOne({ email })
  if (existingUser) {
    return NextResponse.json({ error: 'User already exists' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const result = await db.collection('users').insertOne({
    name,
    email,
    password: hashedPassword,
    role,
    mfaEnabled: false,
    createdAt: new Date()
  })

  return NextResponse.json({ id: result.insertedId, name, email, role })
}
