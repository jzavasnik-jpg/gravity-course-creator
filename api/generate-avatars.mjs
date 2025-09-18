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

    // Simplified prompt with reliable image placeholders
    const prompt = `Create two customer avatars based on this data:

Desire: ${answers.icpDesire}
Problem: ${answers.currentProblem}
Target outcome: ${answers.icpDestination}
Primary emotion: ${answers.sixSs}

Create realistic male and female avatars. Return only valid JSON:
{
  "male": {
    "name": "Male First Name",
    "age": "30-40",
    "income": "$75,000-$150,000",
    "location": "City, State",
    "occupation": "Job Title",
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
    "name": "Female First Name", 
    "age": "28-38",
    "income": "$65,000-$125,000",
    "location": "City, State",
    "occupation": "Job Title",
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
          temperature: 0.7,
          maxOutputTokens: 1024
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

    const cleanedText = generatedText.replace(/```json\n?|\n?```/g, '').trim();
    const avatarData = JSON.parse(cleanedText);

    // Add reliable placeholder images
    avatarData.male.imageUrl = `https://ui-avatars.com/api/?name=${avatarData.male.name}&background=4f46e5&color=white&size=150&format=png`;
    avatarData.female.imageUrl = `https://ui-avatars.com/api/?name=${avatarData.female.name}&background=ec4899&color=white&size=150&format=png`;

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
