import axios from 'axios';

async function test() {
  const hfKey = process.env.HF_KEY || '';
  const [apiKey, apiSecret] = hfKey.split(':');
  
  if (!apiKey || !apiSecret) {
    console.error('HF_KEY non valide ou manquant');
    return;
  }
  
  // Appel direct pour voir le body exact de la réponse 403
  try {
    const resp = await axios.get('https://api.higgsfield.ai/higgsfield-ai/soul/v2/styles', {
      headers: {
        'hf-api-key': apiKey,
        'hf-secret': apiSecret,
      },
    });
    console.log('✓ OK:', resp.status, JSON.stringify(resp.data).slice(0, 200));
  } catch (err: any) {
    console.log('Status:', err?.response?.status);
    console.log('Body:', JSON.stringify(err?.response?.data));
  }
}

test();
