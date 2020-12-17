import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'
import crypto from 'crypto'
import bcrypt from 'bcrypt'

const User = mongoose.model('User', {
  name: {
    type: String,
    unique: true,
    required: true,
    minlength: 3
  },
  password: {
    type: String,
    required: true,
    minlength: 3
  },
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString('hex')
  }
})

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost/shopping'
mongoose.connect(mongoUrl, { useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true, useUnifiedTopology: true })
mongoose.Promies = Promise

const port = process.env.PORT || 8080
const app = express()

app.use(cors())
app.use(bodyParser.json())

app.use((req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    next()
  } else {
    res.status(503).json({ error: 'Service unavaiable' })
  }
})

const authenticateUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ accessToken: req.header('Authorization') })
    if (user) {
      req.user = user
      next()
    } else {
      res.status(401).json({ loggedOut: true })
    }
  } catch (err) {
    res.stauts(403).json({ message: 'Access token missing or wrong' })
  }
}

app.get('/', (req, res) =>
  res.send('Shopping List')
)

// Create user
app.post('/users', async (req, res) => {
  try {
    const { name, password } = req.body
    const rounds = 5
    const user = new User({ name: name, password: bcrypt.hashSync(password, rounds) })
    await user.save()
    res.status(201).json({ userId: user._id, accessToken: user.accessToken })
  } catch (err) {
    res.status(400).json({ message: 'Could not create user', errors: err.errors })
  }
})

// Login user
app.post('/sessions', async (req, res) => {
  try {
    const { name, password } = req.body
    const user = await User.findOne({ name })
    if (user && bcrypt.compareSync(password, user.password)) {
      res.status(201).json({ userId: user._id, accessToken: user.accessToken })
    } else {
      res.status(404).json({ message: 'User not found' })
    }
  } catch (err) {
    res.status(404).json({ notFound: true })
  }
})

app.get('/testingauths', authenticateUser)
app.get('/testingauths', (req, res) => {
  res.json({ test: 'Testing Authorisation' })
})

app.listen(port, () => console.log(`Server running on http://localhost:${port}`))
