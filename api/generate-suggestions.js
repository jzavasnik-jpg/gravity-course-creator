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

    // Simple prompt based on step
    let prompt = '';
    if (step === 1) {
      prompt = 'Generate 7-8 specific suggestions for an ideal client\'s deepest desires in business. Each should start with "They want to" and be 15-25 words. Return as JSON array of strings only.';
    } else if (step === 2) {
      prompt = `Based on their desire: "${userAnswers?.icpDesire || ''}", generate 7-8 decisions they might make. Each should start with "They've decided to" and be 15-25 words. Return as JSON array of strings only.`;
    } else if (step === 3) {
      prompt = `Based on their desire: "${userAnswers?.icpDesire || ''}" and decision: "${userAnswers?.icpDecision || ''}", generate 7-8 current problems/beliefs. Each should start with "They feel like" or "They believe that" and be 15-25 words. Return as JSON array of strings only.`;
    } else if (step === 4) {
      prompt = `Based on their problem: "${userAnswers?.currentProblem || ''}", generate 7-8 ideal destination states. Each should start with "They have" or "They work" and be 15-25 words. Return as JSON array of strings only.`;
    } else if (step === 5) {
      prompt = `Generate 6-7 unique framework names with descriptions as JSON array of objects with "name" and "description" properties. Names should be catchy and memorable.`;
    } else if (step === 8) {
      prompt = `Based on their framework: "${userAnswers?.uniqueFramework || ''}", generate 7-8 specific promised results. Each should start with "They can" or "They will" and be 15-25 words. Return as JSON array of strings only.`;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
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
      throw new Error('No content generated from Gemini');
    }

    let suggestions;
    try {
      suggestions = JSON.parse(generatedText);
    } catch (parseError) {
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse suggestions from AI response');
      }
    }

    return res.status(200).json({
      suggestions: suggestions || [],
      step: step,
      userId: userId
    });

  } catch (error) {
    console.error('Error generating suggestions:', error);
    return res.status(500).json({ 
      error: 'Failed to generate suggestions',
      details: error.message 
    });
  }
}
