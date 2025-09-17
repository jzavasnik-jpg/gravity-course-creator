export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    // Test the most basic possible Gemini call
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Say hello"
          }]
        }]
      })
    });

    const responseText = await response.text();
    
    return res.status(200).json({
      geminiStatus: response.status,
      geminiOk: response.ok,
      geminiResponse: responseText,
      apiKeyExists: !!apiKey
    });

  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
}
