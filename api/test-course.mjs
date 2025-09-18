export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Test environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    // Test request body
    const { answers, statements, avatars, userId } = req.body;
    if (!answers || !statements || !avatars) {
      return res.status(400).json({ error: 'Missing required data' });
    }
    
    return res.status(200).json({ 
      message: 'Environment and request data OK',
      hasApiKey: !!apiKey,
      dataReceived: { answers: !!answers, statements: !!statements, avatars: !!avatars }
    });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
