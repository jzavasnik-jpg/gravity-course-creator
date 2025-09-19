// pages/api/generate-statements.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, userId } = req.body;

    if (!answers || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const prompt = `You are an expert marketing strategist specializing in creating powerful marketing statements. Based on the comprehensive ICP research provided, create two distinct marketing statements.

ICP Research:
- Deepest Desire: "${answers.icpDesire}"
- Key Decision: "${answers.icpDecision}"
- Current Problem: "${answers.currentProblem}"
- Ultimate Destination: "${answers.icpDestination}"
- Unique Framework: "${answers.uniqueFramework}"
- Four Desires Category: "${answers.fourDesires}"
- Primary Six S's Emotion: "${answers.sixSs}"
- Promised Result: "${answers.promisedResult}"

Create these two statements:

1. SOLUTION STATEMENT: A three-verb alliteration from your point of view that describes what you do. Should be catchy, memorable, and use three action verbs that start with the same letter. Focus on the transformation you provide.

2. USP STATEMENT: A unique selling proposition that includes your key mechanism/framework and emphasizes what makes you faster, easier, or more complete than competitors. Should be specific and compelling.

IMPORTANT: Return ONLY a JSON object with this exact structure, no other text:

{
  "solutionStatement": "Your three-verb alliteration solution statement here",
  "uspStatement": "Your unique selling proposition with key mechanism here"
}

Make both statements compelling, specific to the research provided, and aligned with the promised result. The solution statement should be memorable and action-oriented. The USP should clearly differentiate from competitors.`;

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
          maxOutputTokens: 512,
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
    
    let statements;
    try {
      statements = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Generated Text:', generatedText);
      throw new Error('Failed to parse statements data');
    }

    // Validate the response structure
    if (!statements.solutionStatement || !statements.uspStatement) {
      throw new Error('Invalid statements data structure');
    }

    console.log(`[${userId}] Marketing statements generated successfully`);
    
    return res.status(200).json({ 
      statements: statements,
      success: true 
    });

  } catch (error) {
    console.error('Error in generate-statements:', error);
    return res.status(500).json({ 
      error: 'Failed to generate statements',
      details: error.message 
    });
  }
}
