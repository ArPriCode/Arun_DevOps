// Cleanup script to remove 'Drama' genre from all series genres
// It will NOT delete series, only remove the Drama tag from their genres array/JSON.

require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function normalizeGenres(genresField) {
  if (!genresField) return [];

  if (Array.isArray(genresField)) return genresField;

  if (typeof genresField === 'string') {
    try {
      const parsed = JSON.parse(genresField);
      if (Array.isArray(parsed)) return parsed;
      return [parsed];
    } catch {
      return [genresField];
    }
  }

  return [];
}

async function main() {
  console.log('🧹 Starting cleanup: removing \"Drama\" genre from all series...');

  const allSeries = await prisma.series.findMany({
    select: {
      id: true,
      title: true,
      genres: true,
    },
  });

  console.log(`📊 Found ${allSeries.length} series records`);

  let updatedCount = 0;

  for (const series of allSeries) {
    const genresArray = normalizeGenres(series.genres);

    const filtered = genresArray.filter(
      (g) => String(g).toLowerCase() !== 'drama'
    );

    // If nothing changed, skip
    if (filtered.length === genresArray.length) continue;

    await prisma.series.update({
      where: { id: series.id },
      data: {
        genres: filtered.length > 0 ? JSON.stringify(filtered) : JSON.stringify([]),
      },
    });

    updatedCount += 1;
    console.log(
      `✅ Updated series id=${series.id}, title="${series.title}" (removed Drama)`
    );
  }

  console.log('\n🎉 Cleanup complete.');
  console.log(`   Series scanned: ${allSeries.length}`);
  console.log(`   Series updated (Drama removed): ${updatedCount}`);
}

main()
  .catch((err) => {
    console.error('❌ Cleanup failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


