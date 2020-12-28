import mongoose, { Schema } from 'mongoose';
import { Comment } from '../types/types';

const CommentSchema = new Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  comment: {
    type: String,
  },
  likes: {
    type: Array,
    required: true,
    default: [],
  },

},
{
  timestamps: true,
});

export default mongoose.model<Comment>('Comment', CommentSchema);
