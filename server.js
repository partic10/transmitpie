const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

const transmitters = new Map();

function ensureTransmitter(id) {
  if (!transmitters.has(id)) {
    transmitters.set(id, {
      id,
      data: '',
      headers: {},
      received: {
        get: [],
        post: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return transmitters.get(id);
}

function sanitizeHeaders(input) {
  const result = {};

  if (!input) {
    return result;
  }

  if (typeof input === 'string') {
    const lines = input
      .split(/\r?\n|;/)
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      const idx = line.indexOf(':');
      if (idx === -1) {
        continue;
      }

      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (!key || key.toLowerCase() === 'user-agent') {
        continue;
      }
      result[key] = value;
    }

    return result;
  }

  if (typeof input === 'object') {
    for (const [key, value] of Object.entries(input)) {
      if (key.toLowerCase() === 'user-agent') {
        continue;
      }
      result[key] = Array.isArray(value) ? value.join(', ') : String(value);
    }
  }

  return result;
}

function parseDataPayload(body) {
  if (typeof body === 'string') {
    return body;
  }

  if (body && typeof body === 'object') {
    if (typeof body.data === 'string' || typeof body.data === 'number' || typeof body.data === 'boolean') {
      return String(body.data);
    }

    if (typeof body.value === 'string' || typeof body.value === 'number' || typeof body.value === 'boolean') {
      return String(body.value);
    }

    if (typeof body.payload === 'string' || typeof body.payload === 'number' || typeof body.payload === 'boolean') {
      return String(body.payload);
    }
  }

  return '';
}

function buildReceivedEntry(req, body, type) {
  const payload = parseDataPayload(body);
  const headers = sanitizeHeaders(req.headers);

  return {
    type,
    data: payload,
    headers,
    source: req.path,
    receivedAt: new Date().toISOString()
  };
}

app.use(express.json({ type: ['application/json', 'text/plain', 'application/*+json'] }));
app.use(express.text({ type: ['text/plain', 'application/octet-stream'] }));
app.use((req, res, next) => {
  delete req.headers['user-agent'];
  next();
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TransmitPie',
    description: 'Build Logic HTTP Transmitter API',
    note: 'User-Agent is intentionally ignored and not accepted.'
  });
});

app.get('/api/transmitters', (req, res) => {
  res.json({
    transmitters: Array.from(transmitters.values()).map((tx) => ({
      id: tx.id,
      data: tx.data,
      headerCount: Object.keys(tx.headers).length,
      receivedGet: tx.received.get.length,
      receivedPost: tx.received.post.length,
      updatedAt: tx.updatedAt
    }))
  });
});

app.post('/api/transmitters/:id', (req, res) => {
  const transmitter = ensureTransmitter(req.params.id);
  res.status(201).json({
    success: true,
    transmitter: {
      id: transmitter.id,
      data: transmitter.data,
      headers: transmitter.headers,
      received: transmitter.received
    }
  });
});

app.get('/api/transmitters/:id', (req, res) => {
  const transmitter = ensureTransmitter(req.params.id);
  res.json({
    id: transmitter.id,
    data: transmitter.data,
    headers: transmitter.headers,
    received: transmitter.received,
    createdAt: transmitter.createdAt,
    updatedAt: transmitter.updatedAt
  });
});

app.get('/api/transmitters/:id/data', (req, res) => {
  const transmitter = ensureTransmitter(req.params.id);
  res.json({
    id: transmitter.id,
    data: transmitter.data,
    updatedAt: transmitter.updatedAt
  });
});

app.post('/api/transmitters/:id/data', (req, res) => {
  const transmitter = ensureTransmitter(req.params.id);
  const nextData = parseDataPayload(req.body);
  transmitter.data = nextData;
  transmitter.updatedAt = new Date().toISOString();

  res.status(201).json({
    success: true,
    id: transmitter.id,
    data: transmitter.data,
    updatedAt: transmitter.updatedAt
  });
});

app.patch('/api/transmitters/:id/data', (req, res) => {
  const transmitter = ensureTransmitter(req.params.id);
  const nextData = parseDataPayload(req.body);
  transmitter.data = nextData;
  transmitter.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    id: transmitter.id,
    data: transmitter.data,
    updatedAt: transmitter.updatedAt
  });
});

app.get('/api/transmitters/:id/headers', (req, res) => {
  const transmitter = ensureTransmitter(req.params.id);
  res.json({
    id: transmitter.id,
    headers: transmitter.headers,
    updatedAt: transmitter.updatedAt
  });
});

app.post('/api/transmitters/:id/headers', (req, res) => {
  const transmitter = ensureTransmitter(req.params.id);
  const input = req.body || {};
  const nextHeaders = sanitizeHeaders(input);

  transmitter.headers = {
    ...transmitter.headers,
    ...nextHeaders
  };
  transmitter.updatedAt = new Date().toISOString();

  res.status(201).json({
    success: true,
    id: transmitter.id,
    headers: transmitter.headers,
    updatedAt: transmitter.updatedAt
  });
});

app.delete('/api/transmitters/:id/headers/:headerName', (req, res) => {
  const transmitter = ensureTransmitter(req.params.id);
  const headerName = decodeURIComponent(req.params.headerName);
  delete transmitter.headers[headerName];
  transmitter.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    id: transmitter.id,
    headers: transmitter.headers,
    updatedAt: transmitter.updatedAt
  });
});

app.get('/api/transmitters/:id/received/get', (req, res) => {
  const transmitter = ensureTransmitter(req.params.id);
  res.json({
    id: transmitter.id,
    received: transmitter.received.get,
    count: transmitter.received.get.length
  });
});

app.get('/api/transmitters/:id/received/post', (req, res) => {
  const transmitter = ensureTransmitter(req.params.id);
  res.json({
    id: transmitter.id,
    received: transmitter.received.post,
    count: transmitter.received.post.length
  });
});

app.post('/api/transmitters/:id/receive/get', (req, res) => {
  const transmitter = ensureTransmitter(req.params.id);
  const entry = buildReceivedEntry(req, req.body, 'GET');

  transmitter.received.get.push(entry);
  transmitter.updatedAt = new Date().toISOString();

  res.status(201).json({
    success: true,
    id: transmitter.id,
    output: 'received GET',
    entry
  });
});

app.post('/api/transmitters/:id/receive/post', (req, res) => {
  const transmitter = ensureTransmitter(req.params.id);
  const entry = buildReceivedEntry(req, req.body, 'POST');

  transmitter.received.post.push(entry);
  transmitter.updatedAt = new Date().toISOString();

  res.status(201).json({
    success: true,
    id: transmitter.id,
    output: 'received POST',
    entry
  });
});

app.get('/api/transmitters/:id/send', (req, res) => {
  const transmitter = ensureTransmitter(req.params.id);
  const data = String(req.query.data ?? transmitter.data ?? '');
  transmitter.data = data;
  transmitter.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    id: transmitter.id,
    data: transmitter.data,
    updatedAt: transmitter.updatedAt
  });
});

app.post('/api/transmitters/:id/send', (req, res) => {
  const transmitter = ensureTransmitter(req.params.id);
  const data = parseDataPayload(req.body);
  transmitter.data = data;
  transmitter.updatedAt = new Date().toISOString();

  res.status(201).json({
    success: true,
    id: transmitter.id,
    data: transmitter.data,
    updatedAt: transmitter.updatedAt
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    path: req.originalUrl,
    message: 'This TransmitPie route does not exist.'
  });
});

app.listen(PORT, () => {
  console.log(`TransmitPie API running on http://localhost:${PORT}`);
});
