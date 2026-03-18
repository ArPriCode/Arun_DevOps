// Seed TV series from TVMaze into Prisma Series table
// - Uses TVMaze /shows?page= endpoint (popular shows)
// - Filters to clean, non-adult content
// - Only allows OTT platforms (Netflix, Prime Video, Hotstar, SonyLIV, Zee5, MX Player, JioCinema)
// - Prefers Hindi shows + some global popular shows

require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const tvmazeService = require('../src/services/tvmazeService');

const prisma = new PrismaClient();

const TVMAZE_BASE_URL = 'https://api.tvmaze.com';

const HINDI_TARGET = 40;
const GLOBAL_TARGET = 60;
const MAX_PAGES = 10; // how many /shows?page= pages to scan

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isHindiShow = (show) => {
  if (!show) return false;
  if ((show.language || '').toLowerCase() === 'hindi') return true;

  const countryCode =
    show.webChannel?.country?.code || show.network?.country?.code || '';
  if (countryCode.toLowerCase() === 'in') return true;

  return false;
};

const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
};

const mapToPrismaSeries = (show) => {
  const base = tvmazeService.mapShowToSeries(show);

  return {
    title: base.title,
    externalId: base.externalId,
    overview: base.overview,
    posterPath: base.posterPath,
    backdropPath: base.backdropPath,
    genres: JSON.stringify(base.genres || []),
    releaseYear: base.releaseYear,
    averageRating: base.averageRating,
    reviewsCount: base.reviewsCount,
  };
};

async function fetchShowsPage(page) {
  const url = `${TVMAZE_BASE_URL}/shows`;
  const { data } = await axios.get(url, {
    params: { page },
    timeout: 15000,
    headers: { Accept: 'application/json' },
  });
  return Array.isArray(data) ? data : [];
}

async function main() {
  console.log('🚀 Starting TVMaze seed (Hindi + global popular, clean OTT shows only)...');

  const hindiShows = new Map(); // id -> show
  const globalShows = new Map(); // id -> show

  for (let page = 0; page < MAX_PAGES; page++) {
    console.log(`➡️  Fetching TVMaze /shows?page=${page} ...`);
    let pageShows;
    try {
      pageShows = await fetchShowsPage(page);
    } catch (err) {
      console.error(`❌ Failed to fetch page ${page}:`, err.message || err);
      break;
    }

    console.log(`   Got ${pageShows.length} shows on page ${page}`);

    for (const show of pageShows) {
      if (!tvmazeService.isCleanShow(show)) {
        continue;
      }

      const id = show.id;
      if (id == null) continue;

      if (isHindiShow(show)) {
        if (!hindiShows.has(id)) {
          hindiShows.set(id, show);
        }
      } else {
        if (!globalShows.has(id)) {
          globalShows.set(id, show);
        }
      }
    }

    console.log(
      `   Collected so far -> Hindi: ${hindiShows.size}, Global: ${globalShows.size}`
    );

    if (hindiShows.size >= HINDI_TARGET && globalShows.size >= GLOBAL_TARGET) {
      console.log('✅ Target collected, stopping pagination.');
      break;
    }

    await sleep(500);
  }

  // Prepare final list
  const finalShows = [];

  // Hindi first
  for (const show of hindiShows.values()) {
    if (finalShows.length >= HINDI_TARGET + GLOBAL_TARGET) break;
    finalShows.push(show);
  }

  // Then global popular
  for (const show of globalShows.values()) {
    if (finalShows.length >= HINDI_TARGET + GLOBAL_TARGET) break;
    finalShows.push(show);
  }

  console.log(
    `📦 Total TVMaze shows selected for seed: ${finalShows.length} (Hindi: ${hindiShows.size}, Global: ${globalShows.size})`
  );

  if (finalShows.length === 0) {
    console.error('❌ No shows selected. Exiting.');
    process.exitCode = 1;
    return;
  }

  // Map to Prisma format
  const mapped = finalShows.map(mapToPrismaSeries);

  console.log(`🧮 Prepared ${mapped.length} series rows for insertion.`);

  // Insert using createMany with skipDuplicates
  const CHUNK_SIZE = 50;
  let totalInserted = 0;

  try {
    for (let i = 0; i < mapped.length; i += CHUNK_SIZE) {
      const chunk = mapped.slice(i, i + CHUNK_SIZE);
      console.log(
        `💾 Inserting chunk ${i / CHUNK_SIZE + 1} (${chunk.length} items)...`
      );

      const res = await prisma.series.createMany({
        data: chunk,
        skipDuplicates: true,
      });

      const count = res?.count || 0;
      totalInserted += count;
      console.log(`   ✅ Chunk inserted. Count: ${count}`);
      await sleep(200);
    }
  } catch (err) {
    console.error('❌ Error inserting series into database:', err.message || err);
    process.exitCode = 1;
    return;
  }

  console.log('🔍 Preview of first 3 mapped series objects:');
  console.log(JSON.stringify(mapped.slice(0, 3), null, 2));

  console.log('🎉 TVMaze seeding completed.');
  console.log(`   Attempted rows: ${mapped.length}`);
  console.log(`   Inserted (reported by Prisma, skipping duplicates): ${totalInserted}`);
}

main()
  .catch((err) => {
    console.error('❌ Fatal error in TVMaze seed script:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


