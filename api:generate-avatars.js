// api/generate-avatars.js
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, statements, userId } = req.body;

    // Validate required data
    if (!answers || !statements) {
      return res.status(400).json({ error: 'Missing answers or statements data' });
    }

    // Get API key from environment variable (secure)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Create the prompt for generating avatars
    const prompt = `You are an expert customer avatar creator and marketing strategist. Based on the ICP data and marketing statements provided, create two detailed customer avatars (one male, one female) with names and comprehensive pain point analysis.

ICP DATA:
- Deepest Desire: ${answers.icpDesire}
- Key Decision: ${answers.icpDecision}
- Current Problem: ${answers.currentProblem}
- Ultimate Destination: ${answers.icpDestination}
- Unique Framework: ${answers.uniqueFramework}
- Core Desire Market: ${answers.fourDesires}
- Primary Emotion: ${answers.sixSs}
- Promised Result: ${answers.promisedResult}

MARKETING STATEMENTS:
- Solution Statement: ${statements.solutionStatement}
- USP Statement: ${statements.uspStatement}

REQUIREMENTS:
1. Generate realistic first names that feel contemporary and relatable
2. Create pain points for each of the Six S's of Emotional Experience Architecture:
   - Significance: Desire to be seen, heard, and acknowledged as important
   - Safe: Desire for security, protection, and stability
   - Supported: Desire to feel cared for, understood, and part of a community
   - Successful: Desire for accomplishment, achievement, and recognition
   - Surprise-and-delight: Desire for novelty, unexpected joy, and excitement
   - Sharing: Desire to contribute, give back, and be a positive force in the world

3. Each pain point should be specific to the ICP data and written as a relatable concern
4. Pain points should be 8-15 words each, written as "struggles with..." or "feels..."
5. Generate diverse but appropriate profile image URLs using placeholder services
6. Return a JSON object with male and female avatar data

Generate the avatars:`;

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
              male: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  imageUrl: { type: "STRING" },
                  painPoints: {
                    type: "OBJECT",
                    properties: {
                      significance: { type: "STRING" },
                      safe: { type: "STRING" },
                      supported: { type: "STRING" },
                      successful: { type: "STRING" },
                      surprise: { type: "STRING" },
                      sharing: { type: "STRING" }
                    }
                  }
                }
              },
              female: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  imageUrl: { type: "STRING" },
                  painPoints: {
                    type: "OBJECT",
                    properties: {
                      significance: { type: "STRING" },
                      safe: { type: "STRING" },
                      supported: { type: "STRING" },
                      successful: { type: "STRING" },
                      surprise: { type: "STRING" },
                      sharing: { type: "STRING" }
                    }
                  }
                }
              }
            }
          }
        })
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
    const avatarData = JSON.parse(generatedText);

    // Add empty demographic fields that user can fill in
    const processedAvatars = {
      male: {
        name: avatarData.male.name,
        age: '',
        income: '',
        location: '',
        occupation: '',
        imageUrl: avatarData.male.imageUrl,
        painPoints: avatarData.male.painPoints
      },
      female: {
        name: avatarData.female.name,
        age: '',
        income: '',
        location: '',
        occupation: '',
        imageUrl: avatarData.female.imageUrl,
        painPoints: avatarData.female.painPoints
      }
    };

    // Log for debugging (optional)
    console.log(`Generated avatars for user ${userId || 'anonymous'}: ${processedAvatars.male.name} and ${processedAvatars.female.name}`);

    return res.status(200).json({ 
      avatars: processedAvatars,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating avatars:', error);
    return res.status(500).json({ 
      error: `Failed to generate avatars: ${error.message}` 
    });
  }
}