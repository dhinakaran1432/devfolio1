import prisma from '../lib/prisma.js';

const API_KEY = process.env.SYNC_API_KEY || 'devfolio_default_key';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
  'Access-Control-Max-Age': '86400',
};

function setCors(res) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: invalid API key' });
  }

  try {
    if (req.method === 'GET') {
      let state = await prisma.appState.findUnique({ where: { id: 1 } });
      if (!state) state = await prisma.appState.create({ data: { id: 1, data: {} } });
      return res.status(200).json({ success: true, data: state.data || {}, updatedAt: state.updatedAt });
    }

    if (req.method === 'PUT') {
      const body = req.body;
      if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: 'Invalid body' });
      }
      const payload = body.data !== undefined ? body.data : body;
      const updated = await prisma.appState.upsert({
        where: { id: 1 },
        update: { data: payload },
        create: { id: 1, data: payload },
      });
      return res.status(200).json({ success: true, updatedAt: updated.updatedAt });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') console.error('Sync error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}