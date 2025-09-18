export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting API call...');
    
    const { answers, statements, avatars, userId } = req.body;
    if (!answers || !statements || !avatars) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('About to call Google API...');
    
    // Simplified prompt for testing
    const prompt = `Create a simple course outline with title and 2 modules about ${answers.uniqueFramework}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    console.log('Google API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Google API error:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Google API success');
    
    return res.status(200).json({ 
      course: { title: "Test Course", modules: [] },
      message: "Basic API call successful"
    });

  } catch (error) {
    console.error('Full error:', error);
    return res.status(500).json({ 
      error: `Failed to generate course: ${error.message}` 
    });
  }
}
