const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.episode.deleteMany();
  await prisma.season.deleteMany();
  await prisma.series.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword
    }
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: hashedPassword
    }
  });

  const user3 = await prisma.user.create({
    data: {
      name: 'Mike Johnson',
      email: 'mike@example.com',
      password: hashedPassword
    }
  });

  console.log(`Created ${3} users`);

  // Create series
  console.log('Creating series...');

  const series1 = await prisma.series.create({
    data: {
      title: 'Breaking Bad',
      externalId: '1396',
      overview: 'A high school chemistry teacher turned methamphetamine manufacturer partners with a former student.',
      posterPath: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      backdropPath: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
      genres: JSON.stringify(['Crime', 'Thriller']),
      releaseYear: 2008,
      averageRating: 9.5,
      reviewsCount: 2
    }
  });

  const series2 = await prisma.series.create({
    data: {
      title: 'Game of Thrones',
      externalId: '1399',
      overview: 'Nine noble families fight for control over the lands of Westeros.',
      posterPath: '/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
      backdropPath: '/2OMB0ynKlyIenMJWI2Dy9IWT4cM.jpg',
      genres: JSON.stringify(['Fantasy', 'Adventure']),
      releaseYear: 2011,
      averageRating: 8.5,
      reviewsCount: 2
    }
  });

  const series3 = await prisma.series.create({
    data: {
      title: 'Stranger Things',
      externalId: '66732',
      overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments.',
      posterPath: '/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
      backdropPath: '/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
      genres: JSON.stringify(['Sci-Fi', 'Horror', 'Mystery']),
      releaseYear: 2016,
      averageRating: 8.7,
      reviewsCount: 1
    }
  });

  const series4 = await prisma.series.create({
    data: {
      title: 'The Crown',
      externalId: '65494',
      overview: 'Follows the political rivalries and romance of Queen Elizabeth II\'s reign.',
      posterPath: '/1M876KPjulVwppEpldhdc8V4o68.jpg',
      backdropPath: '/84XPpjGvxNyExjSuLQe0SzioErt.jpg',
      genres: JSON.stringify(['History']),
      releaseYear: 2016,
      averageRating: 0,
      reviewsCount: 0
    }
  });

  const series5 = await prisma.series.create({
    data: {
      title: 'The Office',
      externalId: '2316',
      overview: 'A mockumentary on a group of typical office workers.',
      posterPath: '/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg',
      backdropPath: '/bWIIWhnaoWx3FTzXa6FoiFBgk7j.jpg',
      genres: JSON.stringify(['Comedy']),
      releaseYear: 2005,
      averageRating: 0,
      reviewsCount: 0
    }
  });

  console.log(`Created ${5} series`);

  // Create reviews
  console.log('Creating reviews...');

  await prisma.review.create({
    data: {
      userId: user1.id,
      seriesId: series1.id,
      rating: 10,
      text: 'Absolutely phenomenal! The best TV series I have ever watched. The character development is incredible and the plot is mind-blowing.'
    }
  });

  await prisma.review.create({
    data: {
      userId: user2.id,
      seriesId: series1.id,
      rating: 9,
      text: 'Amazing show with great acting and writing. One of the best dramas ever made.'
    }
  });

  await prisma.review.create({
    data: {
      userId: user1.id,
      seriesId: series2.id,
      rating: 9,
      text: 'Epic fantasy series with complex characters and stunning visuals. The first few seasons are masterpieces.'
    }
  });

  await prisma.review.create({
    data: {
      userId: user3.id,
      seriesId: series2.id,
      rating: 8,
      text: 'Great show overall, though the final season was disappointing. Still worth watching for the early seasons.'
    }
  });

  await prisma.review.create({
    data: {
      userId: user2.id,
      seriesId: series3.id,
      rating: 8,
      text: 'Loved the nostalgia and sci-fi elements. Great cast and compelling storyline.'
    }
  });

  console.log(`Created ${5} reviews`);

  // Create favorites
  console.log('Creating favorites...');

  await prisma.favorite.create({
    data: {
      userId: user1.id,
      seriesId: series1.id
    }
  });

  await prisma.favorite.create({
    data: {
      userId: user1.id,
      seriesId: series3.id
    }
  });

  await prisma.favorite.create({
    data: {
      userId: user2.id,
      seriesId: series2.id
    }
  });

  await prisma.favorite.create({
    data: {
      userId: user3.id,
      seriesId: series1.id
    }
  });

  console.log(`Created ${4} favorites`);

  console.log('✅ Seed completed successfully!');
  console.log('\n📝 Sample login credentials:');
  console.log('   Email: john@example.com, Password: password123');
  console.log('   Email: jane@example.com, Password: password123');
  console.log('   Email: mike@example.com, Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

