// pages/api/generate-suggestions.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, step, userId, userAnswers } = req.body;

    if (!prompt || !step || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + process.env.GEMINI_API_KEY, {
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
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Clean and parse the JSON response
    const cleanedText = generatedText.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
    
    let suggestions;
    try {
      suggestions = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Generated Text:', generatedText);
      throw new Error('Failed to parse suggestions data');
    }

    // Validate that we got an array
    if (!Array.isArray(suggestions)) {
      throw new Error('Expected suggestions to be an array');
    }

    console.log(`[${userId}] Generated ${suggestions.length} suggestions for step ${step}`);
    
    return res.status(200).json({ 
      suggestions: suggestions,
      success: true 
    });

  } catch (error) {
    console.error('Error in generate-suggestions:', error);
    return res.status(500).json({ 
      error: 'Failed to generate suggestions',
      details: error.message 
    });
  }
}
