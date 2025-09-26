// scripts/seedData.js
import { connect } from 'mongoose';
import Movie from './models/Movie.js';
import 'dotenv/config';

const sampleMovies = [
  {
    title: "The Shawshank Redemption",
    overview: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
    releaseDate: new Date('1994-09-23'),
    genres: [{ id: 18, name: "Drama" }],
    director: "Frank Darabont",
    runtime: 142,
    posterPath: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    backdropPath: "/hqkIcbrOHL86UncnHIsHVcVmzue.jpg"
  },
  {
    title: "The Godfather",
    overview: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
    releaseDate: new Date('1972-03-24'),
    genres: [{ id: 80, name: "Crime" }, { id: 18, name: "Drama" }],
    director: "Francis Ford Coppola",
    runtime: 175,
    posterPath: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    backdropPath: "/tmU7GeKVybMWFButWEGl2M4GeiP.jpg"
  },
  {
    title: "The Dark Knight",
    overview: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    releaseDate: new Date('2008-07-18'),
    genres: [{ id: 28, name: "Action" }, { id: 80, name: "Crime" }, { id: 18, name: "Drama" }],
    director: "Christopher Nolan",
    runtime: 152,
    posterPath: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdropPath: "/hqkIcbrOHL86UncnHIsHVcVmzue.jpg"
  },
  {
    title: "Pulp Fiction",
    overview: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
    releaseDate: new Date('1994-10-14'),
    genres: [{ id: 80, name: "Crime" }, { id: 18, name: "Drama" }],
    director: "Quentin Tarantino",
    runtime: 154,
    posterPath: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    backdropPath: "/4cDFJr4H1XN5AdPw4AKrmLlMWdO.jpg"
  },
  {
    title: "Forrest Gump",
    overview: "The presidencies of Kennedy and Johnson, the Vietnam War, the Watergate scandal and other historical events unfold from the perspective of an Alabama man with an IQ of 75.",
    releaseDate: new Date('1994-07-06'),
    genres: [{ id: 35, name: "Comedy" }, { id: 18, name: "Drama" }, { id: 10749, name: "Romance" }],
    director: "Robert Zemeckis",
    runtime: 142,
    posterPath: "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
    backdropPath: "/7c9UVPPiTPltouxRVY6N9uugaVA.jpg"
  },
  {
    title: "Inception",
    overview: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    releaseDate: new Date('2010-07-16'),
    genres: [{ id: 28, name: "Action" }, { id: 878, name: "Science Fiction" }, { id: 53, name: "Thriller" }],
    director: "Christopher Nolan",
    runtime: 148,
    posterPath: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    backdropPath: "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg"
  }
];

async function seedDatabase() {
  try {
    await connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-review-platform');
    await Movie.deleteMany({}); // Clear existing data
    await Movie.insertMany(sampleMovies);
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();