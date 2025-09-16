function buildContextualPrompt(step, userAnswers) {
  const baseInstruction = "You are an expert marketing strategist helping create an Ideal Client Profile. Generate 4-5 realistic, specific suggestions that sound natural and human. Return ONLY a JSON array of strings, no other text or formatting.";
  
  // Build context from previous answers
  let context = "CONTEXT from previous answers:\n";
  if (userAnswers.icpDesire) context += `- Their deepest desire: "${userAnswers.icpDesire}"\n`;
  if (userAnswers.icpDecision) context += `- Decision they've made: "${userAnswers.icpDecision}"\n`;
  if (userAnswers.currentProblem) context += `- Current problem/belief: "${userAnswers.currentProblem}"\n`;
  if (userAnswers.icpDestination) context += `- Ultimate destination: "${userAnswers.icpDestination}"\n`;
  if (userAnswers.uniqueFramework) context += `- Unique framework: "${userAnswers.uniqueFramework}"\n`;
  
  switch (step) {
    case 1:
      return `${baseInstruction}

Question: What is your ideal client's deepest desire?
Format each suggestion as a complete sentence starting with "They want to" or "They desire to" or "They crave".
Focus on deep emotional needs like freedom, recognition, security, growth, impact, or fulfillment.
Make them specific to business/entrepreneurship context.

Example format: ["They want to achieve financial freedom and escape the 9-5 grind", "They desire to build a meaningful business that makes a real impact"]`;

    case 2:
      return `${baseInstruction}

${context}

Question: What key decision have they made or are about to make?
Format each suggestion as a complete sentence starting with "They've decided to" or "They've chosen to" or "They've committed to".
Make the decisions logically connected to their desire and build upon the context above.

Example format: ["They've decided to start their own consulting business", "They've chosen to invest in digital marketing education"]`;

    case 3:
      return `${baseInstruction}

${context}

Question: What is one thing they're currently feeling or believing that is NOT working?
Format each suggestion as "They feel like..." or "They believe that..." 
Focus on current frustrations, limiting beliefs, or obstacles preventing them from reaching their desire.
Build upon the context of their desire and decision above.

Example format: ["They feel like they're spinning their wheels without real progress", "They believe they lack the technical skills to succeed online"]`;

    case 4:
      return `${baseInstruction}

${context}

Question: What does their ultimate destination or 'after' state look like?
Format each suggestion starting with "They have" or "They've built" or "They work" or "They enjoy".
Paint a picture of their ideal future state - be specific and inspiring.
Build upon all the context above, especially addressing how they've overcome their current problem.

Example format: ["They have a thriving 6-figure business that runs without them", "They work only 20 hours per week while maintaining their income"]`;

    case 5:
      return `${baseInstruction}

${context}

Question: What is a unique framework or methodology that could help them get there?
Return a JSON array of objects with "name" and "description" properties.
Make the names catchy, memorable, and related to their specific problem and destination. 
Descriptions should be one detailed sentence that connects to their journey from problem to destination.
Build upon all the context above.

Example format: [{"name": "The Freedom Formula", "description": "A step-by-step system for creating passive income streams that work 24/7."}, {"name": "The Authority Accelerator", "description": "A unique framework for rapidly establishing expertise and credibility in any field."}]`;

    case 8:
      return `${baseInstruction}

${context}

Question: What specific result can you promise that's faster, easier, or more complete than competitors?
Format each suggestion starting with "They can" or "They will" or "They get".
Focus on speed, ease, or completeness advantages that directly address their journey from problem to destination.
Build upon all the context above, especially their unique framework and destination.

Example format: ["They can build a profitable business 3x faster than traditional methods", "They get results in 90 days or less with our proven system"]`;

    default:
      return '';
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, step, userId, userAnswers } = req.body;

    // Fixed suggestions for steps 6 & 7 (don't need AI)
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

    // Use Google Gemini for other steps with full context
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('Google API key not configured');
    }

    // Build context from previous answers
    const contextualPrompt = buildContextualPrompt(step, userAnswers);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: contextualPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
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

    // Parse the JSON response from Gemini
    let suggestions;
    try {
      suggestions = JSON.parse(generatedText);
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from the text
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
