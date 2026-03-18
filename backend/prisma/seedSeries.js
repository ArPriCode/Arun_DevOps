const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const GENRES = [
  'Action',
  'Comedy',
  'Sci-Fi',
  'Horror',
  'Thriller',
  'Romance',
  'Crime',
  'Fantasy',
];

async function main() {
  console.log('🌱 Seeding 100 dummy web series...');

  const seriesData = [];

  for (let i = 1; i <= 100; i++) {
    const year = randomInt(2000, 2024);
    const genreCount = randomInt(1, 3);
    const genres = [];
    while (genres.length < genreCount) {
      const g = GENRES[randomInt(0, GENRES.length - 1)];
      if (!genres.includes(g)) genres.push(g);
    }

    seriesData.push({
      title: `Dummy Series ${i}`,
      overview: `This is a dummy description for Dummy Series ${i}.`,
      releaseYear: year,
      genres,
    });
  }

  for (const s of seriesData) {
    await prisma.series.create({
      data: {
        title: s.title,
        overview: s.overview,
        releaseYear: s.releaseYear,
        genres: s.genres,
      },
    });
  }

  console.log('✅ Seeded 100 dummy series into the database.');
}

main()
  .catch((e) => {
    console.error('❌ Seed series failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
