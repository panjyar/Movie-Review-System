import { Schema, model } from 'mongoose';

const movieSchema = new Schema({
  tmdbId: {
    type: Number,
    unique: true,
    sparse: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  overview: {
    type: String,
    required: true
  },
  releaseDate: {
    type: Date,
    required: true
  },
  genres: [{
    id: Number,
    name: String
  }],
  director: {
    type: String,
    default: ''
  },
  cast: [{
    name: String,
    character: String,
    profilePath: String
  }],
  posterPath: {
    type: String,
    default: ''
  },
  backdropPath: {
    type: String,
    default: ''
  },
  runtime: {
    type: Number,
    default: 0
  },
  budget: {
    type: Number,
    default: 0
  },
  revenue: {
    type: Number,
    default: 0
  },
  voteAverage: {
    type: Number,
    default: 0
  },
  voteCount: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  trailers: [{
    key: String,
    name: String,
    site: String,
    type: String
  }]
}, {
  timestamps: true
});

// Calculate average rating when reviews are updated
movieSchema.methods.updateAverageRating = async function() {
  const Review = model('Review');
  const stats = await Review.aggregate([
    { $match: { movie: this._id } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  
  if (stats.length > 0) {
    this.averageRating = Math.round(stats[0].avgRating * 10) / 10;
    this.totalReviews = stats[0].count;
  } else {
    this.averageRating = 0;
    this.totalReviews = 0;
  }
  
  await this.save();
};

export default model('Movie', movieSchema);