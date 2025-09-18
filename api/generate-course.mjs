export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, statements, avatars, userId } = req.body;

    if (!answers || !statements || !avatars) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Simplified prompt that's less likely to cause issues
    const prompt = `Create a course outline based on this information:

Problem: ${answers.currentProblem}
Solution: ${answers.uniqueFramework}
Target outcome: ${answers.icpDestination}
Primary emotion: ${answers.sixSs}

Create a course with 6 modules, each with 3-4 lessons. Return only valid JSON in this format:
{
  "title": "Course Title Here",
  "description": "Course description here",
  "coreBeliefStatement": "One core belief statement",
  "estimatedHours": "12-16 hours",
  "modules": [
    {
      "title": "Module 1 Title",
      "description": "Module description",
      "learningObjective": "What students will believe after this module",
      "lessons": [
        {
          "title": "Lesson Title",
          "description": "Lesson description",
          "coreConcept": "Main concept",
          "hasDetailedContent": false
        }
      ]
    }
  ]
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
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No content generated from AI');
    }

    // Clean the response (remove markdown formatting if present)
    const cleanedText = generatedText.replace(/```json\n?|\n?```/g, '').trim();
    
    let courseData;
    try {
      courseData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', cleanedText);
      throw new Error('Invalid JSON response from AI');
    }

    return res.status(200).json({ 
      course: courseData,
      timestamp: new Date().toISOString(),
      generatedFor: {
        avatars: [avatars.male.name, avatars.female.name],
        framework: answers.uniqueFramework,
        primaryEmotion: answers.sixSs
      }
    });

  } catch (error) {
    console.error('Error generating course structure:', error);
    return res.status(500).json({ 
      error: `Failed to generate course structure: ${error.message}` 
    });
  }
}
