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

    // Very simple prompt to avoid API issues
    const prompt = `Create two customer personas based on: Problem="${answers.currentProblem}", Desire="${answers.icpDesire}", Solution="${answers.uniqueFramework}". Return valid JSON only:

{
  "male": {
    "name": "John Smith",
    "age": "35-45",
    "income": "$80,000-$120,000", 
    "location": "Austin, TX",
    "occupation": "Marketing Manager",
    "sixSsPainPoints": {
      "Significance": "Feels overlooked for promotions",
      "Safe": "Worried about job security",
      "Supported": "Lacks mentorship", 
      "Successful": "Behind on career goals",
      "Surprise-and-delight": "Work feels routine",
      "Sharing": "Can't contribute meaningfully"
    }
  },
  "female": {
    "name": "Sarah Johnson",
    "age": "30-40", 
    "income": "$70,000-$110,000",
    "location": "Denver, CO", 
    "occupation": "Business Consultant",
    "sixSsPainPoints": {
      "Significance": "Struggles to be heard in meetings",
      "Safe": "Uncertain about business stability", 
      "Supported": "Feels isolated as entrepreneur",
      "Successful": "Revenue goals unmet",
      "Surprise-and-delight": "Lacks excitement in work",
      "Sharing": "Unable to make desired impact"
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
          parts: [{ text: prompt }]
        }]
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

    // Add reliable placeholder images with different colors for gender
    avatarData.male.imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarData.male.name)}&background=4f46e5&color=white&size=150`;
    avatarData.female.imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarData.female.name)}&background=ec4899&color=white&size=150`;

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
