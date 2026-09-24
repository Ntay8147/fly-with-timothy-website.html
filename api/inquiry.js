const GHL_BASE = 'https://services.leadconnectorhq.com';
const GHL_VERSION = '2021-07-28';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, details } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const token = process.env.GHL_API_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  const pipelineId = process.env.GHL_PIPELINE_ID;
  const stageId = process.env.GHL_STAGE_ID;

  if (!token || !locationId || !pipelineId || !stageId) {
    console.error('Missing GHL environment variables');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Version: GHL_VERSION,
    'Content-Type': 'application/json',
  };

  try {
    const contactRes = await fetch(`${GHL_BASE}/contacts/upsert`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        locationId,
        name,
        email,
        phone: phone || undefined,
        source: 'Fly With Timothy Website',
      }),
    });
    const contactData = await contactRes.json();
    if (!contactRes.ok) {
      console.error('GHL contact upsert failed', contactData);
      return res.status(502).json({ error: 'Failed to create contact' });
    }

    const contactId = contactData.contact?.id || contactData.id;

    const oppRes = await fetch(`${GHL_BASE}/opportunities/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        pipelineId,
        locationId,
        pipelineStageId: stageId,
        contactId,
        name: `${name} — Charter Inquiry`,
        status: 'open',
      }),
    });
    const oppData = await oppRes.json();
    if (!oppRes.ok) {
      console.error('GHL opportunity create failed', oppData);
      return res.status(502).json({ error: 'Failed to create opportunity' });
    }

    if (details) {
      const noteRes = await fetch(`${GHL_BASE}/contacts/${contactId}/notes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ body: `Trip details: ${details}` }),
      });
      if (!noteRes.ok) {
        console.error('GHL note creation failed', await noteRes.json().catch(() => ({})));
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('GHL integration error', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
