// pages/api/regenerate-statement.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, statementType, userId } = req.body;

    if (!answers || !statementType || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (statementType !== 'solution' && statementType !== 'usp') {
      return res.status(400).json({ error: 'Invalid statement type. Must be "solution" or "usp"' });
    }

    let prompt;

    if (statementType === 'solution') {
      prompt = `You are an expert marketing strategist. Create a new solution statement based on the ICP research provided.

ICP Research:
- Deepest Desire: "${answers.icpDesire}"
- Key Decision: "${answers.icpDecision}"
- Current Problem: "${answers.currentProblem}"
- Ultimate Destination: "${answers.icpDestination}"
- Unique Framework: "${answers.uniqueFramework}"
- Four Desires Category: "${answers.fourDesires}"
- Primary Six S's Emotion: "${answers.sixSs}"
- Promised Result: "${answers.promisedResult}"

Create a SOLUTION STATEMENT that is:
- A three-verb alliteration from your point of view
- Describes what you do for clients
- Uses three action verbs that start with the same letter
- Catchy, memorable, and transformation-focused
- Different from typical solution statements

IMPORTANT: Return ONLY the solution statement text, no JSON formatting, no quotes, no additional text.

Example format: "We Guide, Grow, and Guarantee your business transformation journey."`;

    } else {
      prompt = `You are an expert marketing strategist. Create a new USP statement based on the ICP research provided.

ICP Research:
- Deepest Desire: "${answers.icpDesire}"
- Key Decision: "${answers.icpDecision}"
- Current Problem: "${answers.currentProblem}"
- Ultimate Destination: "${answers.icpDestination}"
- Unique Framework: "${answers.uniqueFramework}"
- Four Desires Category: "${answers.fourDesires}"
- Primary Six S's Emotion: "${answers.sixSs}"
- Promised Result: "${answers.promisedResult}"

Create a USP STATEMENT that:
- Includes your key mechanism/framework
- Emphasizes what makes you faster, easier, or more complete
- Clearly differentiates from competitors
- Is specific and compelling
- References the promised result

IMPORTANT: Return ONLY the USP statement text, no JSON formatting, no quotes, no additional text.

Example format: "Our proprietary 90-day system delivers 3x faster results than traditional methods while requiring 50% less effort from busy entrepreneurs."`;
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
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 256,
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

    const statement = data.candidates[0].content.parts[0].text.trim();
    
    // Clean up any potential formatting
    const cleanedStatement = statement
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/^\s*-\s*/, '') // Remove leading dash
      .trim();

    if (!cleanedStatement || cleanedStatement.length < 10) {
      throw new Error('Generated statement is too short or empty');
    }

    console.log(`[${userId}] ${statementType} statement regenerated successfully`);
    
    return res.status(200).json({ 
      statement: cleanedStatement,
      statementType: statementType,
      success: true 
    });

  } catch (error) {
    console.error('Error in regenerate-statement:', error);
    return res.status(500).json({ 
      error: 'Failed to regenerate statement',
      details: error.message 
    });
  }
}
