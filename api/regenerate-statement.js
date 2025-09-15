// api/regenerate-statement.js
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, statementType, userId } = req.body;

    // Validate required data
    if (!answers || !statementType) {
      return res.status(400).json({ error: 'Missing answers or statement type' });
    }

    if (!['solution', 'usp'].includes(statementType)) {
      return res.status(400).json({ error: 'Invalid statement type. Must be "solution" or "usp"' });
    }

    // Get API key from environment variable (secure)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Create specific prompt based on statement type
    let prompt;

    if (statementType === 'solution') {
      prompt = `You are a world-class marketing copywriter. Generate a compelling SOLUTION STATEMENT based on the ICP data.

FORMAT: 'I help [ICP Decision] to [ICP Destination] by teaching them how to [three alliterative action verbs] their dream life.'

ICP DATA:
- Decision: ${answers.icpDecision}
- Destination: ${answers.icpDestination}
- Framework: ${answers.uniqueFramework}

REQUIREMENTS:
1. Use three powerful, alliterative action verbs (like "build, boost, breakthrough" or "create, cultivate, conquer")
2. Make it compelling and specific to their situation
3. Keep it concise and impactful
4. Return ONLY a JSON object with "statement" property

Generate the solution statement:`;

    } else { // usp
      prompt = `You are a world-class marketing copywriter. Generate a powerful USP STATEMENT based on the ICP data.

FORMAT: 'The Gravity Method is the key to [ICP desire] and is only attainable through [unique mechanism name].'

ICP DATA:
- Desire: ${answers.icpDesire}
- Framework: ${answers.uniqueFramework}
- Core Need: ${answers.fourDesires}

REQUIREMENTS:
1. Make the connection between their desire and the unique framework clear
2. Emphasize exclusivity and uniqueness
3. Keep it powerful and memorable
4. Return ONLY a JSON object with "statement" property

Generate the USP statement:`;
    }

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
              statement: { type: "STRING" }
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
    const result = JSON.parse(generatedText);

    // Log for debugging (optional)
    console.log(`Regenerated ${statementType} statement for user ${userId || 'anonymous'}`);

    return res.status(200).json({ 
      statement: result.statement,
      statementType: statementType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error regenerating statement:', error);
    return res.status(500).json({ 
      error: `Failed to regenerate ${req.body.statementType || 'statement'}: ${error.message}` 
    });
  }
}
