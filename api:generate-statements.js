// api/generate-statements.js
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers } = req.body;

    // Make sure we have the required data
    if (!answers) {
      return res.status(400).json({ error: 'Missing answers data' });
    }

    // Get API key from environment variable (secure)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Create the prompt for generating final statements
    const prompt = `You are a world-class marketing copywriter and strategist. Generate two powerful marketing statements based on the provided Ideal Client Profile (ICP) data.

SOLUTION STATEMENT FORMAT: 'I help [ICP Decision] to [ICP Destination] by teaching them how to [three alliterative action verbs] their dream life.'

USP STATEMENT FORMAT: 'The Gravity Method is the key to [ICP desire] and is only attainable through [unique mechanism name].'

ICP DATA:
- Deepest Desire: ${answers.icpDesire}
- Key Decision: ${answers.icpDecision}
- Current Problem: ${answers.currentProblem}
- Ultimate Destination: ${answers.icpDestination}
- Unique Framework: ${answers.uniqueFramework}
- Core Desire Market: ${answers.fourDesires}
- Primary Emotion: ${answers.sixSs}
- Promised Result: ${answers.promisedResult}

REQUIREMENTS:
1. Make the solution statement compelling and use strong alliterative verbs
2. Make the USP statement powerful and unique
3. Keep both statements concise and impactful
4. Return ONLY a JSON object with "solutionStatement" and "uspStatement" properties

Generate the statements now:`;

    // Call Google Gemini API
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
        }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              solutionStatement: { type: "STRING" },
              uspStatement: { type: "STRING" }
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the generated content
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No content generated');
    }

    // Parse the JSON response
    const statements = JSON.parse(generatedText);

    return res.status(200).json({ 
      statements: statements 
    });

  } catch (error) {
    console.error('Error generating statements:', error);
    return res.status(500).json({ 
      error: `Failed to generate statements: ${error.message}` 
    });
  }
}