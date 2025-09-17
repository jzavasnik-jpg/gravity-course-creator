export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { step, userAnswers } = req.body;

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

    // Smart contextual suggestions for other steps
    const contextualSuggestions = {
      1: [
        "They want to achieve complete financial freedom so they never worry about money again",
        "They desire to build a meaningful business that creates lasting positive impact",
        "They crave the flexibility to work from anywhere while maintaining stable income",
        "They want to escape the corporate rat race and become their own boss",
        "They desire to create generational wealth for their family's future",
        "They want to be recognized as a thought leader in their industry",
        "They crave the time freedom to pursue their passions and hobbies"
      ],
      2: [
        "They've decided to leave their corporate job within the next 12 months",
        "They've chosen to invest heavily in their personal brand and online presence",
        "They've committed to learning digital marketing and sales skills",
        "They've decided to start a consulting business in their area of expertise",
        "They've chosen to build an audience through content creation and networking",
        "They've committed to hiring a business coach to accelerate their progress",
        "They've decided to partner with other entrepreneurs in complementary fields"
      ],
      3: [
        "They feel like they're spinning their wheels without making real progress",
        "They believe they lack the technical skills needed to succeed online",
        "They feel overwhelmed by all the conflicting business advice available",
        "They believe they don't have enough experience to charge premium prices",
        "They feel like they're working harder but not seeing proportional results",
        "They believe they need more credentials before clients will take them seriously",
        "They feel stuck in analysis paralysis and struggle to take decisive action"
      ],
      4: [
        "They have a thriving 6-figure business that runs without constant oversight",
        "They work only 25 hours per week while earning more than their corporate salary",
        "They've built a team that handles operations while they focus on strategy",
        "They enjoy complete location independence and travel while working",
        "They have multiple income streams that provide financial security",
        "They're recognized as an authority in their field with speaking opportunities",
        "They've achieved the perfect work-life balance they always dreamed of"
      ],
      5: [
        { name: "The Freedom Formula", description: "A step-by-step system for creating passive income streams that work around the clock." },
        { name: "The Authority Accelerator", description: "A proven framework for rapidly building expertise and credibility in any field." },
        { name: "The Scale Smart Method", description: "A unique approach to growing a business without burnout or quality compromise." },
        { name: "The Impact Blueprint", description: "A comprehensive system for building profitable businesses that create positive change." },
        { name: "The Time Leverage System", description: "A methodology for maximizing productivity while minimizing time investment." },
        { name: "The Expert Positioning Protocol", description: "A strategic framework for becoming the go-to authority in your niche market." }
      ],
      8: [
        "They can build a profitable business 3x faster than traditional methods",
        "They get guaranteed results in 90 days or receive personalized coaching",
        "They achieve their income goals without working more than 30 hours per week",
        "They create a sustainable business model that grows consistently over time",
        "They build their authority and attract high-value clients organically",
        "They develop systems that generate revenue even while they sleep",
        "They gain the confidence and skills to scale beyond six figures"
      ]
    };

    return res.status(200).json({
      suggestions: contextualSuggestions[step] || [],
      step: step,
      userId: req.body.userId
    });

  } catch (error) {
    return res.status(500).json({ 
      error: error.message
    });
  }
}
