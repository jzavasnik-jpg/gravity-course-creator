// pages/api/regenerate-module.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, statements, avatars, moduleIndex, existingCourse, userId } = req.body;

    if (!answers || !statements || !avatars || moduleIndex === undefined || !existingCourse || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get context about other modules
    const otherModules = existingCourse.modules
      .map((module, index) => index !== moduleIndex ? `${index + 1}. ${module.title}` : null)
      .filter(Boolean)
      .join('\n');

    const prompt = `You are an expert course creator specializing in the Gravity Culture methodology. Regenerate Module ${moduleIndex + 1} for this course while maintaining logical flow with other modules.

Course Context:
- Course Title: "${existingCourse.title}"
- Course Description: "${existingCourse.description}"
- Core Belief: "${existingCourse.coreBeliefStatement}"

Other Modules in Course:
${otherModules}

ICP Research:
- Deepest Desire: "${answers.icpDesire}"
- Current Problem: "${answers.currentProblem}"
- Ultimate Destination: "${answers.icpDestination}"
- Unique Framework: "${answers.uniqueFramework}"
- Primary Six S's Emotion: "${answers.sixSs}"

Customer Avatars:
- ${avatars.male.name} (${avatars.male.occupation})
- ${avatars.female.name} (${avatars.female.occupation})

Create a NEW Module ${moduleIndex + 1} that:
- Fits logically in the course sequence
- Has a different approach/angle than the current module
- Addresses specific needs from the ICP research
- Contains 3-5 lessons with clear learning progression

IMPORTANT: Return ONLY a JSON object with this exact structure, no other text:

{
  "title": "New module title that fits the sequence",
  "description": "What this module covers and why it's important",
  "learningObjective": "What students will achieve after completing this module",
  "lessons": [
    {
      "title": "Lesson title",
      "description": "What this lesson teaches",
      "coreConcept": "Key concept covered",
      "hasDetailedContent": false
    }
  ]
}

Make the module title engaging and benefit-focused. Ensure lessons build logically toward the module's learning objective.`;

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
    
    let module;
    try {
      module = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Generated Text:', generatedText);
      throw new Error('Failed to parse module data');
    }

    // Validate the response structure
    if (!module.title || !module.lessons || !Array.isArray(module.lessons)) {
      throw new Error('Invalid module data structure');
    }

    console.log(`[${userId}] Module ${moduleIndex + 1} regenerated: ${module.title}`);
    
    return res.status(200).json({ 
      module: module,
      success: true 
    });

  } catch (error) {
    console.error('Error in regenerate-module:', error);
    return res.status(500).json({ 
      error: 'Failed to regenerate module',
      details: error.message 
    });
  }
}
