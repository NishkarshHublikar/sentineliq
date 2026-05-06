import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, email, role } = await req.json()
  const { id } = params

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db()
  
  const updateData: any = {}
  if (name) updateData.name = name
  if (email) updateData.email = email
  if (role) updateData.role = role

  const result = await db.collection('users').updateOne(
    { _id: new ObjectId(id) },
    { $set: updateData }
  )

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  // Prevent admin from deleting themselves
  if (id === session.user.id) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db()
  
  const result = await db.collection('users').deleteOne({ _id: new ObjectId(id) })

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
