// pages/api/generate-pain-points.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, statements, avatarProfile, gender, userId } = req.body;

    if (!answers || !statements || !avatarProfile || !gender || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const prompt = `You are an expert customer psychology analyst. Create specific pain points for this customer avatar based on the Six S's of Emotional Experience Architecture.

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

For this specific avatar, create pain points for each of the Six S's. Make them personal, specific, and realistic for someone with their background and demographics.

The Six S's are:
1. Significance - Feeling unimportant, unrecognized, invisible
2. Safe - Feeling insecure, vulnerable, at risk
3. Supported - Feeling alone, misunderstood, abandoned
4. Successful - Feeling like a failure, stuck, behind others
5. Surprise-and-delight - Feeling bored, predictable, uninspired
6. Sharing - Feeling selfish, unable to contribute, disconnected from purpose

IMPORTANT: Return ONLY a JSON object with this exact structure, no other text:

{
  "Significance": "Specific pain point about feeling unimportant/unrecognized in their context",
  "Safe": "Specific pain point about feeling insecure/vulnerable in their situation", 
  "Supported": "Specific pain point about feeling alone/misunderstood in their journey",
  "Successful": "Specific pain point about feeling unsuccessful/stuck in their goals",
  "Surprise-and-delight": "Specific pain point about feeling bored/uninspired in their work/life",
  "Sharing": "Specific pain point about being unable to contribute/make meaningful impact"
}

Make each pain point 1-2 sentences that feel authentic to this person's specific situation, occupation, and life stage. Reference their actual circumstances where relevant.`;

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
          maxOutputTokens: 800,
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
    
    let painPoints;
    try {
      painPoints = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Generated Text:', generatedText);
      throw new Error('Failed to parse pain points data');
    }

    // Validate the response structure
    const requiredKeys = ['Significance', 'Safe', 'Supported', 'Successful', 'Surprise-and-delight', 'Sharing'];
    const hasAllKeys = requiredKeys.every(key => painPoints.hasOwnProperty(key));
    
    if (!hasAllKeys) {
      throw new Error('Invalid pain points data structure');
    }

    console.log(`[${userId}] Pain points generated for ${gender} avatar: ${avatarProfile.name}`);
    
    return res.status(200).json({ 
      painPoints: painPoints,
      success: true 
    });

  } catch (error) {
    console.error('Error in generate-pain-points:', error);
    return res.status(500).json({ 
      error: 'Failed to generate pain points',
      details: error.message 
    });
  }
}
