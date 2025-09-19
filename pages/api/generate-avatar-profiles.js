// pages/api/generate-avatar-profiles.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, statements, userId } = req.body;

    if (!answers || !statements || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const prompt = `You are an expert customer avatar creator. Based on the ICP research provided, create two detailed customer avatars (one male, one female) with realistic demographics.

ICP Research:
- Deepest Desire: "${answers.icpDesire}"
- Key Decision: "${answers.icpDecision}"
- Current Problem: "${answers.currentProblem}"
- Ultimate Destination: "${answers.icpDestination}"
- Unique Framework: "${answers.uniqueFramework}"
- Four Desires Category: "${answers.fourDesires}"
- Primary Six S's Emotion: "${answers.sixSs}"
- Promised Result: "${answers.promisedResult}"

Marketing Statements:
- Solution Statement: "${statements.solutionStatement}"
- USP Statement: "${statements.uspStatement}"

Create two customer avatars with these exact specifications:

IMPORTANT: Return ONLY a JSON object with this exact structure, no other text:

{
  "male": {
    "name": "Realistic first and last name",
    "age": "Age range like '35-42'",
    "income": "Income range like '$75k-$120k'", 
    "location": "Specific city, state/country",
    "occupation": "Specific job title",
    "imageUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
  },
  "female": {
    "name": "Realistic first and last name",
    "age": "Age range like '32-38'",
    "income": "Income range like '$85k-$140k'",
    "location": "Specific city, state/country", 
    "occupation": "Specific job title",
    "imageUrl": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face"
  }
}

Make the avatars realistic and aligned with the business/entrepreneurship context of the ICP data. Use real Unsplash photo URLs with appropriate professional headshots. Ensure names, occupations, and demographics make sense together.`;

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
          temperature: 0.7,
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
    
    let avatars;
    try {
      avatars = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Generated Text:', generatedText);
      throw new Error('Failed to parse avatar data');
    }

    // Validate the response structure
    if (!avatars.male || !avatars.female) {
      throw new Error('Invalid avatar data structure');
    }

    console.log(`[${userId}] Avatar profiles generated successfully`);
    
    return res.status(200).json({ 
      avatars: avatars,
      success: true 
    });

  } catch (error) {
    console.error('Error in generate-avatar-profiles:', error);
    return res.status(500).json({ 
      error: 'Failed to generate avatar profiles',
      details: error.message 
    });
  }
}
