import { Schema, model } from 'mongoose';

const reviewSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  movie: {
    type: Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Ensure one review per user per movie
reviewSchema.index({ user: 1, movie: 1 }, { unique: true });

reviewSchema.post('save', async function() {
  const Movie = model('Movie');
  const movie = await Movie.findById(this.movie);
  if (movie) {
    await movie.updateAverageRating();
  }
});

reviewSchema.post('remove', async function() {
  const Movie = model('Movie');
  const movie = await Movie.findById(this.movie);
  if (movie) {
    await movie.updateAverageRating();
  }
});

export default model('Review', reviewSchema);