export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    // Test everything EXCEPT the actual fetch call
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    const testBody = JSON.stringify({
      contents: [{
        parts: [{
          text: "Say hello"
        }]
      }]
    });
    
    return res.status(200).json({
      message: "Everything prepared, but no external call made",
      apiKeyExists: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyStart: apiKey ? apiKey.substring(0, 5) : 'none',
      urlPrepared: testUrl.substring(0, 100) + '...',
      bodyPrepared: testBody.length
    });

  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
}
