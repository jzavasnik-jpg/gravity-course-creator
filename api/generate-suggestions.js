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

    // Use Google Gemini for other steps
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('Google API key not configured');
    }

    // For now, return test suggestions while we know the connection works
    const testSuggestions = {
      1: ["They want to achieve financial freedom and escape the 9-5 grind", "They desire to build a meaningful business that makes a real impact", "They crave the freedom to work from anywhere in the world"],
      2: ["They've decided to start their own consulting business", "They've chosen to invest in digital marketing education", "They've committed to building an online course business"],
      3: ["They feel like they're spinning their wheels without real progress", "They believe they lack the technical skills to succeed online", "They feel overwhelmed by all the conflicting advice out there"],
      4: ["They have a thriving 6-figure business that runs without them", "They work only 20 hours per week while maintaining their income", "They've built a team that handles the day-to-day operations"],
      5: [
        { name: "The Freedom Formula", description: "A step-by-step system for creating passive income streams that work 24/7." },
        { name: "The Authority Accelerator", description: "A unique framework for rapidly establishing expertise and credibility in any field." }
      ],
      8: ["They can build a profitable business 3x faster than traditional methods", "They get results in 90 days or less with our proven system"]
    };

    return res.status(200).json({
      suggestions: testSuggestions[step] || [],
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
