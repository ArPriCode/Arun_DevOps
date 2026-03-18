const axios = require('axios');
const cache = require('../utils/cache');

const TVMAZE_BASE_URL = 'https://api.tvmaze.com';

// Blocked adult/erotic keywords
const BLOCKED_KEYWORDS = [
  'adult',
  '18+',
  'erotic',
  'xxx',
  'bold',
  'sensual',
  'sexual',
];

// Allowed OTT platforms (webChannel/network names)
const ALLOWED_PLATFORMS = [
  'netflix',
  'amazon prime video',
  'prime video',
  'primevideo',
  'disney+ hotstar',
  'hotstar',
  'disney+',
  'sonyliv',
  'sony liv',
  'zee5',
  'mx player',
  'jio cinema',
  'jiocinema',
];

const normalize = (val) =>
  (val || '').toString().toLowerCase().trim();

const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
};

const hasBlockedKeyword = (text) => {
  const t = normalize(text);
  if (!t) return false;
  return BLOCKED_KEYWORDS.some((kw) => t.includes(kw));
};

const isAllowedPlatform = (show) => {
  const webName = normalize(show.webChannel?.name);
  const netName = normalize(show.network?.name);
  const combined = `${webName} ${netName}`.trim();
  if (!combined) return false;
  return ALLOWED_PLATFORMS.some((p) => combined.includes(p));
};

const isCleanShow = (show) => {
  if (!show) return false;

  // Basic adult-type filter
  if (normalize(show.type) === 'adult') return false;

  const name = show.name || '';
  const summary = stripHtml(show.summary || '');
  const officialSite = show.officialSite || '';

  if (hasBlockedKeyword(name)) return false;
  if (hasBlockedKeyword(summary)) return false;
  if (hasBlockedKeyword(officialSite)) return false;

  // Only allowed OTT platforms
  if (!isAllowedPlatform(show)) return false;

  return true;
};

const mapShowToSeries = (show) => {
  const premieredYear = show.premiered
    ? parseInt(String(show.premiered).slice(0, 4), 10)
    : null;

  return {
    externalId: String(show.id),
    title: show.name || 'Untitled',
    overview: stripHtml(show.summary || ''),
    posterPath: show.image?.original || show.image?.medium || null,
    backdropPath: null,
    genres: show.genres && show.genres.length ? show.genres : [],
    releaseYear: premieredYear,
    averageRating: show.rating?.average || 0,
    reviewsCount: show.weight || 0,
  };
};

const tvmazeService = {
  // Search shows
  async searchShows(query) {
    const q = (query || '').trim();
    if (!q) {
      return [];
    }

    const cacheKey = `tvmaze:search:${q.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const url = `${TVMAZE_BASE_URL}/search/shows`;

    const { data } = await axios.get(url, {
      params: { q },
      timeout: 10000,
      headers: { Accept: 'application/json' },
    });

    const shows = Array.isArray(data)
      ? data.map((item) => item.show).filter(Boolean)
      : [];

    const filtered = shows.filter(isCleanShow);
    const mapped = filtered.map(mapShowToSeries);

    cache.set(cacheKey, mapped);
    return mapped;
  },

  // Show details
  async getShowDetails(id) {
    const cacheKey = `tvmaze:show:${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const url = `${TVMAZE_BASE_URL}/shows/${id}`;
    const { data: show } = await axios.get(url, {
      timeout: 10000,
      headers: { Accept: 'application/json' },
    });

    if (!isCleanShow(show)) {
      return null;
    }

    const mapped = mapShowToSeries(show);
    cache.set(cacheKey, mapped);
    return mapped;
  },

  // Fetch all shows page-wise from TVMaze `/shows?page=`
  async getShowsPage(page = 0) {
    const cacheKey = `tvmaze:shows:${page}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const url = `${TVMAZE_BASE_URL}/shows`;
    const { data } = await axios.get(url, {
      params: { page },
      timeout: 15000,
      headers: { Accept: 'application/json' },
    });

    const shows = Array.isArray(data) ? data : [];
    cache.set(cacheKey, shows);
    return shows;
  },

  // Utility filters for seed script
  isCleanShow,
  isAllowedPlatform,
  stripHtml,
  mapShowToSeries,
};

module.exports = tvmazeService;


