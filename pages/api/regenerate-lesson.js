// pages/api/regenerate-lesson.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, statements, avatars, courseData, moduleIndex, lessonIndex, userId } = req.body;

    if (!answers || !statements || !avatars || !courseData || moduleIndex === undefined || lessonIndex === undefined || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const module = courseData.modules[moduleIndex];
    const lesson = module.lessons[lessonIndex];

    // Get context about other lessons in the module
    const otherLessons = module.lessons
      .map((l, index) => index !== lessonIndex ? `${index + 1}. ${l.title}` : null)
      .filter(Boolean)
      .join('\n');

    const prompt = `You are an expert course creator specializing in the Gravity Culture methodology. Regenerate detailed lesson content using the proven framework structure with a fresh approach.

Course Context:
- Course: "${courseData.title}"
- Module: "${module.title}" 
- Module Objective: "${module.learningObjective}"
- Lesson: "${lesson.title}"
- Lesson Description: "${lesson.description}"
- Core Concept: "${lesson.coreConcept}"

Other Lessons in Module:
${otherLessons}

ICP Research:
- Deepest Desire: "${answers.icpDesire}"
- Current Problem: "${answers.currentProblem}"
- Ultimate Destination: "${answers.icpDestination}"
- Unique Framework: "${answers.uniqueFramework}"
- Primary Six S's Emotion: "${answers.sixSs}"

Customer Avatar Context:
- Male Avatar: ${avatars.male.name} (${avatars.male.occupation})
- Female Avatar: ${avatars.female.name} (${avatars.female.occupation})

Create NEW detailed lesson content with a different angle/approach than before. Use the Gravity Culture methodology structure:

IMPORTANT: Return ONLY a JSON object with this exact structure, no other text:

{
  "title": "${lesson.title}",
  "description": "Updated lesson description with new angle",
  "coreConcept": "Refined core concept focus",
  "hasDetailedContent": true,
  "structure": {
    "originStory": "A NEW compelling personal story hook with different angle than typical origin stories",
    "falseBeliefs": [
      "Different false belief #1 that blocks progress",
      "Different false belief #2 that students hold",
      "Different false belief #3 that needs reframing"
    ],
    "secrets": [
      {
        "title": "Secret #1 Title (fresh perspective)",
        "description": "What this secret reveals differently",
        "explanation": "Detailed explanation with new insights and examples"
      },
      {
        "title": "Secret #2 Title (fresh perspective)", 
        "description": "What this secret reveals differently",
        "explanation": "Detailed explanation with new insights and examples"
      },
      {
        "title": "Secret #3 Title (fresh perspective)",
        "description": "What this secret reveals differently", 
        "explanation": "Detailed explanation with new insights and examples"
      }
    ],
    "tactics": [
      "NEW specific actionable tactic #1 with clear implementation steps",
      "NEW specific actionable tactic #2 that's different from typical approaches",
      "NEW specific actionable tactic #3 that builds on the refined secrets"
    ],
    "exercise": "A NEW practical exercise or assignment that creates transformation through a different approach than standard exercises"
  }
}

Make this regenerated version distinctly different from typical lesson content. Use fresh perspectives, unique insights, and actionable tactics that feel innovative. The origin story should be surprising and memorable. Address different false beliefs than usual. Create secrets that provide genuine "aha" moments.`;

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
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
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
    
    let lessonContent;
    try {
      lessonContent = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Generated Text:', generatedText);
      throw new Error('Failed to parse lesson data');
    }

    // Validate the response structure
    if (!lessonContent.structure || !lessonContent.structure.secrets || !Array.isArray(lessonContent.structure.secrets)) {
      throw new Error('Invalid lesson data structure');
    }

    console.log(`[${userId}] Lesson regenerated: ${lessonContent.title} (Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1})`);
    
    return res.status(200).json({ 
      lesson: lessonContent,
      success: true 
    });

  } catch (error) {
    console.error('Error in regenerate-lesson:', error);
    return res.status(500).json({ 
      error: 'Failed to regenerate lesson',
      details: error.message 
    });
  }
}
