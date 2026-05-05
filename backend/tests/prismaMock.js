function createModelDelegate(modelName, store, idCounters) {
  function nextId() {
    idCounters[modelName] = (idCounters[modelName] || 0) + 1;
    return idCounters[modelName];
  }

  function matchesWhere(row, where) {
    if (!where) return true;

    // Prisma-style composite key used in `reviewsController`
    if (where.userId_seriesId) {
      return (
        row.userId === where.userId_seriesId.userId &&
        row.seriesId === where.userId_seriesId.seriesId
      );
    }

    return Object.entries(where).every(([k, v]) => row[k] === v);
  }

  function applySelect(row, select) {
    if (!select) return row;
    const out = {};
    for (const [k, enabled] of Object.entries(select)) {
      if (enabled) out[k] = row[k];
    }
    return out;
  }

  function applyInclude(row, include, db) {
    if (!include) return row;
    const out = { ...row };

    if (include.user) {
      const user = db.user.rows.find((u) => u.id === row.userId) || null;
      if (include.user.select && user) out.user = applySelect(user, include.user.select);
      else out.user = user;
    }

    if (include.series) {
      const series = db.series.rows.find((s) => s.id === row.seriesId) || null;
      out.series = series;
    }

    return out;
  }

  return {
    rows: store,

    async deleteMany(args = {}) {
      const where = args.where;
      if (!where) {
        const count = store.length;
        store.splice(0, store.length);
        return { count };
      }

      let count = 0;
      for (let i = store.length - 1; i >= 0; i--) {
        if (matchesWhere(store[i], where)) {
          store.splice(i, 1);
          count++;
        }
      }
      return { count };
    },

    async delete({ where }) {
      const idx = store.findIndex((r) => matchesWhere(r, where));
      if (idx === -1) throw new Error(`${modelName}.delete: record not found`);
      const [deleted] = store.splice(idx, 1);
      return deleted;
    },

    async create({ data, select, include } = {}) {
      const now = new Date();
      const row = {
        id: nextId(),
        createdAt: data?.createdAt ?? now,
        updatedAt: data?.updatedAt ?? now,
        ...data,
      };
      store.push(row);

      // `select` and `include` are mutually exclusive in real Prisma; tests/controllers use one or the other.
      if (select) return applySelect(row, select);
      if (include) return applyInclude(row, include, this.__db);
      return row;
    },

    async update({ where, data, include } = {}) {
      const row = store.find((r) => matchesWhere(r, where));
      if (!row) throw new Error(`${modelName}.update: record not found`);
      Object.assign(row, data || {});
      row.updatedAt = new Date();
      if (include) return applyInclude(row, include, this.__db);
      return row;
    },

    async findUnique({ where, include, select } = {}) {
      const row = store.find((r) => matchesWhere(r, where));
      if (!row) return null;
      if (select) return applySelect(row, select);
      if (include) return applyInclude(row, include, this.__db);
      return row;
    },

    async findMany({ where, skip = 0, take, orderBy, include } = {}) {
      let rows = store.filter((r) => matchesWhere(r, where));

      if (orderBy?.createdAt) {
        const dir = orderBy.createdAt === 'desc' ? -1 : 1;
        rows = rows.slice().sort((a, b) => (a.createdAt > b.createdAt ? dir : -dir));
      }

      rows = rows.slice(skip, take ? skip + take : undefined);
      if (include) return rows.map((r) => applyInclude(r, include, this.__db));
      return rows;
    },

    async count({ where } = {}) {
      return store.filter((r) => matchesWhere(r, where)).length;
    },

    async aggregate({ where, _avg, _count } = {}) {
      const rows = store.filter((r) => matchesWhere(r, where));

      const out = {};
      if (_avg?.rating) {
        const sum = rows.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
        out._avg = { rating: rows.length ? sum / rows.length : null };
      }

      if (_count) {
        out._count = rows.length;
      }

      return out;
    },
  };
}

function getSharedState() {
  // Share one in-memory DB across ALL PrismaClient instances in the test process.
  // This matches real Prisma behavior where all clients see the same database.
  if (!global.__CINEMORA_PRISMA_MOCK__) {
    const idCounters = {};
    const db = {
      user: { rows: [] },
      series: { rows: [] },
      review: { rows: [] },
      favorite: { rows: [] },
    };

    const delegates = {};
    for (const model of Object.keys(db)) {
      const delegate = createModelDelegate(model, db[model].rows, idCounters);
      delegate.__db = db;
      delegates[model] = delegate;
    }

    global.__CINEMORA_PRISMA_MOCK__ = { db, delegates };
  }

  return global.__CINEMORA_PRISMA_MOCK__;
}

class PrismaClient {
  constructor() {
    const { delegates } = getSharedState();
    this.user = delegates.user;
    this.series = delegates.series;
    this.review = delegates.review;
    this.favorite = delegates.favorite;
  }

  async $disconnect() {}

  async $transaction(fn) {
    // We don't implement rollback for tests; run callback with this as tx.
    return await fn(this);
  }
}

module.exports = { PrismaClient };
