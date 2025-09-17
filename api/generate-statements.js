export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, userId } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error('Google API key not configured');
    }

    const prompt = `You are an expert marketing strategist. Based on the following ideal customer profile answers, generate two powerful marketing statements in JSON format.

Customer Profile:
- Deepest Desire: ${answers.icpDesire}
- Key Decision: ${answers.icpDecision}
- Current Problem: ${answers.currentProblem}
- Ultimate Destination: ${answers.icpDestination}
- Unique Framework: ${answers.uniqueFramework}
- Core Desire Market: ${answers.fourDesires}
- Primary Emotion: ${answers.sixSs}
- Promised Result: ${answers.promisedResult}

Generate a JSON response with exactly this format:
{
  "solutionStatement": "A compelling solution statement that addresses their problem and desire",
  "uspStatement": "A unique selling proposition that highlights your competitive advantage"
}

Requirements for the statements:
1. Solution Statement: Should clearly identify the target customer, their problem, and how your solution helps them achieve their desired outcome. Make it emotionally compelling and specific to their situation.

2. USP Statement: Should differentiate you from competitors by highlighting what makes your approach unique, faster, easier, or more complete. Reference their unique framework and promised results.

Both statements should be:
- Emotionally compelling and specific to their situation
- Clear about the transformation promised
- Professional but conversational tone
- 2-3 sentences each maximum
- Focus on outcomes and benefits, not features

Return ONLY the JSON, no other text.`;

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
          temperature: 0.8,
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

    let statements;
    try {
      statements = JSON.parse(generatedText);
    } catch (parseError) {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        statements = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse statements from AI response');
      }
    }

    return res.status(200).json({
      statements: statements,
      userId: userId
    });

  } catch (error) {
    console.error('Error generating statements:', error);
    return res.status(500).json({ 
      error: 'Failed to generate statements',
      details: error.message 
    });
  }
}
