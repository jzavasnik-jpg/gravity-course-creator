export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { step } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error('API key not found');
    }

    // Only try AI for step 1, use test data for others
    if (step !== 1) {
      const testSuggestions = [
        "They want to achieve financial freedom and escape the corporate grind",
        "They desire to build a meaningful business that creates lasting impact",
        "They crave the flexibility to work from anywhere in the world"
      ];
      
      return res.status(200).json({
        suggestions: testSuggestions,
        step: step,
        source: 'test'
      });
    }

    // Simple AI call for step 1 only
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Generate exactly 5 business desires starting with "They want to". Return as JSON array of strings. Example: ["They want to achieve financial freedom", "They want to build a legacy business"]'
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API responded with status: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No text generated from Gemini');
    }

    let suggestions;
    try {
      // Try to parse as JSON
      suggestions = JSON.parse(generatedText);
    } catch (parseError) {
      // If that fails, look for JSON array in the text
      const jsonMatch = generatedText.match(/\[.*\]/s);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not find valid JSON in response');
      }
    }

    return res.status(200).json({
      suggestions: suggestions || [],
      step: step,
      source: 'ai',
      rawResponse: generatedText
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: error.message,
      step: req.body?.step || 'unknown'
    });
  }
}
