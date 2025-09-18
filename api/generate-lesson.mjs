export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      answers, 
      statements, 
      avatars, 
      courseData, 
      moduleIndex, 
      lessonIndex, 
      userId 
    } = req.body;

    if (!answers || !statements || !avatars || !courseData) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    if (moduleIndex === undefined || lessonIndex === undefined) {
      return res.status(400).json({ error: 'Module and lesson indices required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const module = courseData.modules[moduleIndex];
    const lesson = module.lessons[lessonIndex];

    const prompt = `You are an expert lesson creator specializing in the Gravity Culture methodology. Create detailed lesson content for a specific lesson within an existing course.

COURSE CONTEXT:
- Course Title: ${courseData.title}
- Course Core Belief: ${courseData.coreBeliefStatement}
- Module: ${module.title} (${module.description})
- Lesson: ${lesson.title} (${lesson.description})
- Core Concept: ${lesson.coreConcept}

ICP FOUNDATION:
- Deepest Desire: ${answers.icpDesire}
- Current Problem: ${answers.currentProblem}
- Ultimate Destination: ${answers.icpDestination}
- Unique Framework: ${answers.uniqueFramework}
- Primary Emotion: ${answers.sixSs}

TARGET AVATARS:
- Male Avatar: ${avatars.male.name}
- Female Avatar: ${avatars.female.name}

LESSON STRUCTURE REQUIREMENTS:
Create a comprehensive lesson following the Gravity Culture methodology:

1. ORIGIN STORY HOOK: An engaging narrative that starts at the protagonist's struggle, backtracks to show how they got there, shows their transformation/discovery, and ends with a powerful epiphany that introduces the core concept.

2. FALSE BELIEFS: Identify 3 common misconceptions students have that prevent them from grasping the core concept.

3. THREE SECRETS FRAMEWORK:
   - Secret 1: Framework that addresses false belief about the vehicle/method itself
   - Secret 2: Framework that addresses false belief about external factors preventing success
   - Secret 3: Framework that addresses false belief about internal factors preventing success

4. TACTICS: 2-3 practical implementation steps students can take immediately

5. EXERCISE: A hands-on activity that reinforces the lesson and helps students experience the core concept

All content should elicit feelings aligned with "${answers.sixSs}" and speak directly to ${avatars.male.name} and ${avatars.female.name}.

Return as JSON with this exact structure:
{
  "title": "${lesson.title}",
  "description": "${lesson.description}",
  "coreConcept": "${lesson.coreConcept}",
  "structure": {
    "originStory": "Engaging hook narrative starting at struggle",
    "falseBeliefs": ["Misconception 1", "Misconception 2", "Misconception 3"],
    "secrets": [
      {
        "title": "Secret 1 Title",
        "description": "Addresses vehicle/method false belief",
        "explanation": "Detailed framework explanation"
      },
      {
        "title": "Secret 2 Title",
        "description": "Addresses external factors false belief",
        "explanation": "Detailed framework explanation"
      },
      {
        "title": "Secret 3 Title",
        "description": "Addresses internal factors false belief",
        "explanation": "Detailed framework explanation"
      }
    ],
    "tactics": ["Tactic 1", "Tactic 2", "Tactic 3"],
    "exercise": "Hands-on activity description"
  },
  "hasDetailedContent": true
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

    const lessonContent = JSON.parse(generatedText);

    console.log(`Generated lesson content for "${lesson.title}" in module ${moduleIndex + 1}`);

    return res.status(200).json({ 
      lesson: lessonContent,
      moduleIndex,
      lessonIndex,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating lesson content:', error);
    return res.status(500).json({ 
      error: `Failed to generate lesson content: ${error.message}` 
    });
  }
}
