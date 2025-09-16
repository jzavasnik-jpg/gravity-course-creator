export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, step, userId } = req.body;

    // Fixed suggestions for steps 6 & 7 (don't need AI)
    if (step === 6) {
      return res.status(200).json({
        suggestions: [
          { label: 'Money', description: 'The desire for financial freedom, wealth, and security.' },
          { label: 'Time', description: 'The desire for more freedom, efficiency, and a better work-life balance.' },
          { label: 'Experiences', description: 'The desire for personal growth, adventure, and new challenges.' },
          { label: 'Relationships', description: 'The desire for deeper connections with others, community, or a romantic partner.' }
        ]
      });
    }

    if (step === 7) {
      return res.status(200).json({
        suggestions: [
          { label: 'Significance', description: 'The desire to be seen, heard, and acknowledged as important.' },
          { label: 'Safe', description: 'The desire for security, protection, and stability.' },
          { label: 'Supported', description: 'The desire to feel cared for, understood, and part of a community.' },
          { label: 'Successful', description: 'The desire for accomplishment, achievement, and recognition.' },
          { label: 'Surprise-and-delight', description: 'The desire for novelty, unexpected joy, and excitement.' },
          { label: 'Sharing', description: 'The desire to contribute, give back, and be a positive force in the world.' }
        ]
      });
    }

    // Use Google Gemini for other steps
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('Google API key not configured');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No content generated from Gemini');
    }

    // Parse the JSON response from Gemini
    let suggestions;
    try {
      suggestions = JSON.parse(generatedText);
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from the text
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse suggestions from AI response');
      }
    }

    return res.status(200).json({
      suggestions: suggestions || [],
      step: step,
      userId: userId
    });

  } catch (error) {
    console.error('Error generating suggestions:', error);
    return res.status(500).json({ 
      error: 'Failed to generate suggestions',
      details: error.message 
    });
  }
}
