export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { step, userId, userAnswers } = req.body;

    // Fixed suggestions for steps 6 & 7
    if (step === 6) {
      return res.status(200).json({
        suggestions: [
          { label: 'Money', description: 'The desire for financial freedom, wealth, and security.' },
          { label: 'Time', description: 'The desire for more freedom, efficiency, and a better work-life balance.' },
          { label: 'Experiences', description: 'The desire for personal growth, adventure, and new challenges.' },
          { label: 'Relationships', description: 'The desire for deeper connections with others, community, or a romantic partner.' }
        ]
      });
    }

    if (step === 7) {
      return res.status(200).json({
        suggestions: [
          { label: 'Significance', description: 'The desire to be seen, heard, and acknowledged as important.' },
          { label: 'Safe', description: 'The desire for security, protection, and stability.' },
          { label: 'Supported', description: 'The desire to feel cared for, understood, and part of a community.' },
          { label: 'Successful', description: 'The desire for accomplishment, achievement, and recognition.' },
          { label: 'Surprise-and-delight', description: 'The desire for novelty, unexpected joy, and excitement.' },
          { label: 'Sharing', description: 'The desire to contribute, give back, and be a positive force in the world.' }
        ]
      });
    }

    // Real AI for other steps
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('Google API key not configured');
    }

    // Build context string
    let context = '';
    if (userAnswers?.icpDesire) context += `Previous desire: ${userAnswers.icpDesire}. `;
    if (userAnswers?.icpDecision) context += `Previous decision: ${userAnswers.icpDecision}. `;
    if (userAnswers?.currentProblem) context += `Current problem: ${userAnswers.currentProblem}. `;
    if (userAnswers?.icpDestination) context += `Destination: ${userAnswers.icpDestination}. `;
    if (userAnswers?.uniqueFramework) context += `Framework: ${userAnswers.uniqueFramework}. `;

    // Simple prompts by step
    const prompts = {
      1: `Generate 7 realistic business desires. Each should start with "They want to" and be 15-25 words. Focus on entrepreneurship and freedom. Return only JSON array of strings.`,
      2: `${context}Generate 7 business decisions. Each should start with "They've decided to" and be 15-25 words. Build on the context. Return only JSON array of strings.`,
      3: `${context}Generate 7 current problems/beliefs. Each should start with "They feel like" or "They believe that" and be 15-25 words. Return only JSON array of strings.`,
      4: `${context}Generate 7 ideal outcomes. Each should start with "They have" or "They work" and be 15-25 words. Return only JSON array of strings.`,
      5: `Generate 6 unique business frameworks as JSON array of objects with "name" and "description" properties. Names should be catchy, descriptions one sentence.`,
      8: `${context}Generate 7 promised results. Each should start with "They can" or "They will" and be 15-25 words. Return only JSON array of strings.`
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompts[step]
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No content generated');
    }

    let suggestions;
    try {
      suggestions = JSON.parse(generatedText);
    } catch (parseError) {
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response');
      }
    }

    return res.status(200).json({
      suggestions: suggestions || [],
      step: step,
      userId: userId
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate suggestions',
      details: error.message 
    });
  }
}
