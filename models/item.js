import mongoose from 'mongoose'

export const Item = mongoose.model('Item', {
  item: {
    type: String,
    required: true,
    minlength: 2
  },
  section: {
    type: String,
    required: true,
    minlength: 3
  },
  basket: {
    type: String
  },
  shopper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
})
