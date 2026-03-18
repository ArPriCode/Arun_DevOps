// Cleanup script to remove any adult content that might have been inserted
// This checks series in DB and removes any that might be adult (based on keywords in overview)

require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ADULT_KEYWORDS = ['18+', 'adult', 'explicit', 'xxx', 'porn', 'nsfw', 'mature', 'sexual'];

async function main() {
  console.log('🧹 Starting cleanup of potential adult content from database...');

  try {
    // Get all series
    const allSeries = await prisma.series.findMany({
      select: {
        id: true,
        title: true,
        overview: true,
        externalId: true
      }
    });

    console.log(`📊 Found ${allSeries.length} series in database`);

    const toDelete = [];
    for (const series of allSeries) {
      const overview = (series.overview || '').toLowerCase();
      const title = (series.title || '').toLowerCase();
      
      const hasAdultKeyword = ADULT_KEYWORDS.some(keyword => 
        overview.includes(keyword.toLowerCase()) || title.includes(keyword.toLowerCase())
      );

      if (hasAdultKeyword) {
        toDelete.push(series.id);
        console.log(`🚫 Marked for deletion: id=${series.id}, title=${series.title}`);
      }
    }

    if (toDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${toDelete.length} series with adult keywords...`);
      
      // Soft delete by setting deletedAt
      const result = await prisma.series.updateMany({
        where: {
          id: { in: toDelete }
        },
        data: {
          deletedAt: new Date()
        }
      });

      console.log(`✅ Soft-deleted ${result.count} series`);
    } else {
      console.log('✅ No adult content found in database');
    }

    console.log('\n📊 Summary:');
    console.log(`   Total series checked: ${allSeries.length}`);
    console.log(`   Adult content found: ${toDelete.length}`);
    console.log(`   Clean series remaining: ${allSeries.length - toDelete.length}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error('❌ Fatal error:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

