const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')

async function createUser() {
  const uri = "mongodb://localhost:27017/sentineliq"
  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db()
    const users = db.collection('users')

    const email = "admin@sentineliq.gov"
    const password = "password123"
    const hashedPassword = await bcrypt.hash(password, 12)

    const result = await users.updateOne(
      { email },
      { 
        $set: { 
          name: "Chief Administrator",
          email,
          password: hashedPassword,
          role: "admin",
          mfaEnabled: false,
          createdAt: new Date()
        } 
      },
      { upsert: true }
    )

    console.log(`User ${email} created/updated successfully.`)
  } catch (err) {
    console.error(err)
  } finally {
    await client.close()
  }
}

createUser()
