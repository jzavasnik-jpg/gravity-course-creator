export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, statements, userId } = req.body;

    if (!answers || !statements) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const prompt = `Create two detailed customer avatars based on this ICP data:

ICP FOUNDATION:
- Deepest Desire: ${answers.icpDesire}
- Current Problem: ${answers.currentProblem}
- Ultimate Destination: ${answers.icpDestination}
- Unique Framework: ${answers.uniqueFramework}
- Primary Emotion: ${answers.sixSs}

MARKETING STATEMENTS:
- Solution Statement: ${statements.solutionStatement}
- USP Statement: ${statements.uspStatement}

Create one male avatar and one female avatar. For images, use placeholder URLs that clearly specify gender:
- Male avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
- Female avatar: "https://images.unsplash.com/photo-1494790108755-2616b2e1d7cc?w=150&h=150&fit=crop&crop=face"

Return as JSON:
{
  "male": {
    "name": "Male Name",
    "age": "Age range",
    "income": "Income level",
    "location": "Location",
    "occupation": "Job title",
    "imageUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    "sixSsPainPoints": {
      "Significance": "How they feel insignificant",
      "Safe": "How they feel unsafe",
      "Supported": "How they feel unsupported",
      "Successful": "How they feel unsuccessful",
      "Surprise-and-delight": "How they lack excitement",
      "Sharing": "How they feel unable to contribute"
    }
  },
  "female": {
    "name": "Female Name",
    "age": "Age range", 
    "income": "Income level",
    "location": "Location",
    "occupation": "Job title",
    "imageUrl": "https://images.unsplash.com/photo-1494790108755-2616b2e1d7cc?w=150&h=150&fit=crop&crop=face",
    "sixSsPainPoints": {
      "Significance": "How they feel insignificant",
      "Safe": "How they feel unsafe", 
      "Supported": "How they feel unsupported",
      "Successful": "How they feel unsuccessful",
      "Surprise-and-delight": "How they lack excitement",
      "Sharing": "How they feel unable to contribute"
    }
  }
}`;

    // Rest of your API code...
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
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No content generated');
    }

    const avatarData = JSON.parse(generatedText);

    // Ensure correct gender images are set (fallback in case AI doesn't follow instructions)
    avatarData.male.imageUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face";
    avatarData.female.imageUrl = "https://images.unsplash.com/photo-1494790108755-2616b2e1d7cc?w=150&h=150&fit=crop&crop=face";

    return res.status(200).json({ 
      avatars: avatarData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating avatars:', error);
    return res.status(500).json({ 
      error: `Failed to generate avatars: ${error.message}` 
    });
  }
}
