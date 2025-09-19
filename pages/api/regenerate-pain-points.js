// pages/api/regenerate-pain-points.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, statements, avatarProfile, gender, sCategory, userId } = req.body;

    if (!answers || !statements || !avatarProfile || !gender || !sCategory || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Define what each S category means
    const sDefinitions = {
      'Significance': 'Feeling unimportant, unrecognized, invisible, or like their voice doesn\'t matter',
      'Safe': 'Feeling insecure, vulnerable, at risk, or uncertain about their stability',
      'Supported': 'Feeling alone, misunderstood, abandoned, or lacking guidance and community',
      'Successful': 'Feeling like a failure, stuck, behind others, or unable to achieve their goals',
      'Surprise-and-delight': 'Feeling bored, predictable, uninspired, or lacking excitement and novelty',
      'Sharing': 'Feeling selfish, unable to contribute meaningfully, or disconnected from their purpose to help others'
    };

    const prompt = `You are an expert customer psychology analyst. Generate a new, specific pain point for the "${sCategory}" category of the Six S's framework.

Customer Avatar:
- Name: ${avatarProfile.name}
- Age: ${avatarProfile.age}
- Income: ${avatarProfile.income}
- Location: ${avatarProfile.location}
- Occupation: ${avatarProfile.occupation}

ICP Research Context:
- Deepest Desire: "${answers.icpDesire}"
- Key Decision: "${answers.icpDecision}"
- Current Problem: "${answers.currentProblem}"
- Ultimate Destination: "${answers.icpDestination}"
- Primary Six S's Emotion: "${answers.sixSs}"

"${sCategory}" Definition: ${sDefinitions[sCategory]}

Create a NEW pain point for the "${sCategory}" category that is:
- Specific to this avatar's demographics and situation
- Different from typical pain points (be creative and insightful)
- 1-2 sentences long
- Emotionally resonant and authentic
- Related to their business/professional context where relevant

IMPORTANT: Return ONLY the pain point text, no JSON formatting, no quotes, no additional text. Just the raw pain point description.

Example format: "Despite having years of experience, they constantly question whether their ideas are actually valuable, leading them to hold back in meetings and miss opportunities to showcase their expertise."`;

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
          maxOutputTokens: 200,
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

    const painPoint = data.candidates[0].content.parts[0].text.trim();
    
    // Clean up any potential formatting
    const cleanedPainPoint = painPoint
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/^\s*-\s*/, '') // Remove leading dash
      .trim();

    if (!cleanedPainPoint || cleanedPainPoint.length < 10) {
      throw new Error('Generated pain point is too short or empty');
    }

    console.log(`[${userId}] Pain point regenerated for ${gender} avatar (${sCategory}): ${avatarProfile.name}`);
    
    return res.status(200).json({ 
      painPoint: cleanedPainPoint,
      category: sCategory,
      success: true 
    });

  } catch (error) {
    console.error('Error in regenerate-pain-points:', error);
    return res.status(500).json({ 
      error: 'Failed to regenerate pain point',
      details: error.message 
    });
  }
}
