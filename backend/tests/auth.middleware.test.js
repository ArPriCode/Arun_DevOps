const jwt = require('jsonwebtoken');
const { verifyToken, requireRole } = require('../src/Middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

// Helper: build mock req/res/next
function mockReq(headers = {}) {
  return { headers };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const mockNext = jest.fn();

beforeEach(() => {
  mockNext.mockClear();
});

// ─── verifyToken ─────────────────────────────────────────────────────────────

describe('verifyToken middleware', () => {
  it('calls next() and attaches user when token is valid', () => {
    const payload = { id: 1, email: 'test@example.com', role: 'user' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();

    verifyToken(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({ id: 1, email: 'test@example.com' });
  });

  it('returns 401 when no Authorization header is present', () => {
    const req = mockReq({});
    const res = mockRes();

    verifyToken(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'No token provided' }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 when token format is invalid (missing Bearer prefix)', () => {
    const req = mockReq({ authorization: 'InvalidToken abc' });
    const res = mockRes();

    verifyToken(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 when token is expired', () => {
    const payload = { id: 1, email: 'test@example.com' };
    // Sign with -1s expiry so it is already expired
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: -1 });

    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();

    verifyToken(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('expired') }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 when token is signed with wrong secret', () => {
    const token = jwt.sign({ id: 1 }, 'wrong-secret', { expiresIn: '1h' });

    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();

    verifyToken(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid token' }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });
});

// ─── requireRole ─────────────────────────────────────────────────────────────

describe('requireRole middleware', () => {
  it('calls next() when user has the required role', () => {
    const req = { user: { id: 1, role: 'admin' } };
    const res = mockRes();

    requireRole('admin')(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('returns 403 when user has a different role', () => {
    const req = { user: { id: 1, role: 'user' } };
    const res = mockRes();

    requireRole('admin')(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Forbidden') }),
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 when req.user is not set', () => {
    const req = {};
    const res = mockRes();

    requireRole('admin')(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
