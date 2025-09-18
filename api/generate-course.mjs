export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Just return mock data for now
    const mockCourse = {
      title: "Test Course Title",
      description: "Test course description",
      coreBeliefStatement: "Test belief statement",
      estimatedHours: "10-15 hours",
      modules: [
        {
          title: "Module 1: Foundation",
          description: "Basic foundation concepts",
          learningObjective: "Understand the basics",
          lessons: [
            {
              title: "Lesson 1: Introduction",
              description: "Getting started",
              coreConcept: "The main concept",
              hasDetailedContent: false
            }
          ]
        }
      ]
    };

    return res.status(200).json({ 
      course: mockCourse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: `Failed: ${error.message}` 
    });
  }
}
