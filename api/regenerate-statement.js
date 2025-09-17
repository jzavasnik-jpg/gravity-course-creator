export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, statementType, userId } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error('Google API key not configured');
    }

    const prompts = {
      solution: `Based on this customer profile, create a compelling solution statement:
      - Problem: ${answers.currentProblem}
      - Desire: ${answers.icpDesire}
      - Solution: ${answers.uniqueFramework}
      - Result: ${answers.promisedResult}
      
      Format: "For [target customer] who [problem], our [solution] provides [result]."
      Make it emotionally compelling and specific. Return only the statement text.`,
      
      usp: `Based on this customer profile, create a unique selling proposition:
      - Framework: ${answers.uniqueFramework}
      - Result: ${answers.promisedResult}
      - Problem: ${answers.currentProblem}
      
      Highlight what makes this approach unique, faster, easier, or more complete than competitors.
      Return only the USP statement text.`
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompts[statementType]
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 512,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const statement = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return res.status(200).json({
      statement: statement?.trim() || '',
      userId: userId
    });

  } catch (error) {
    console.error('Error regenerating statement:', error);
    return res.status(500).json({ 
      error: 'Failed to regenerate statement',
      details: error.message 
    });
  }
}
