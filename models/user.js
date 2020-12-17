import mongoose from 'mongoose'
import crypto from 'crypto'

export const User = mongoose.model('User', {
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
