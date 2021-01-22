import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { User } from './models/user'
import { Item } from './models/item'

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

app.post('/items', authenticateUser)
app.post('/items', async (req, res) => {
  try {
    const { item, section, basket } = req.body
    const addedItem = await new Item({ item, section, basket, shopper: req.user._id }).save()
    res.status(201).json(addedItem)
  } catch (err) {
    res.status(400).json({ message: 'Could not save item', errors: err.errors })
  }
})

app.get('/items', authenticateUser)
app.get('/items', async (req, res) => {
  const messages = await Item.find().populate('shopper', 'name').sort({ createdAt: 'desc' }).exec()
  res.json(messages)
})

app.delete('/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params
    const item = await Item.findOneAndDelete({ _id: itemId })
    res.status(200).json(item)
  } catch (err) {
    res.status(400).json({ message: 'Could not delete item, not found', error: err.errors })
  }
})

app.listen(port, () => console.log(`Server running on http://localhost:${port}`))
