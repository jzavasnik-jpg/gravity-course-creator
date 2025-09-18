export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, statements, userId } = req.body;

    const maleAvatar = generateAvatar('male', answers);
    const femaleAvatar = generateAvatar('female', answers);

    return res.status(200).json({
      avatars: {
        male: maleAvatar,
        female: femaleAvatar
      },
      userId: userId
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to generate avatars',
      details: error.message 
    });
  }
}

function generateAvatar(gender, answers) {
  const maleNames = ['Michael', 'David', 'James', 'Robert', 'John', 'Mark', 'Steve', 'Chris', 'Daniel', 'Andrew'];
  const femaleNames = ['Sarah', 'Jennifer', 'Lisa', 'Michelle', 'Amanda', 'Jessica', 'Rachel', 'Emily', 'Lauren', 'Nicole'];
  
  const names = gender === 'male' ? maleNames : femaleNames;
  const name = names[Math.floor(Math.random() * names.length)];
  
  const ages = ['28-35', '35-42', '42-48', '38-45', '32-40', '30-38', '40-47'];
  const age = ages[Math.floor(Math.random() * ages.length)];
  
  const incomes = ['$75K-$125K', '$125K-$200K', '$85K-$150K', '$100K-$175K', '$65K-$100K', '$150K-$250K'];
  const income = incomes[Math.floor(Math.random() * incomes.length)];
  
  const locations = ['Austin, TX', 'Denver, CO', 'Nashville, TN', 'Portland, OR', 'Raleigh, NC', 'Phoenix, AZ', 'Atlanta, GA', 'Seattle, WA'];
  const location = locations[Math.floor(Math.random() * locations.length)];
  
  const occupations = getContextualOccupation(answers);
  const occupation = occupations[Math.floor(Math.random() * occupations.length)];
  
  const sixSsPainPoints = generateSixSsPainPoints(answers, occupation);

  return {
    name: name,
    age: age,
    income: income,
    location: location,
    occupation: occupation,
    imageUrl: getAvatarImage(gender, name),
    sixSsPainPoints: sixSsPainPoints
  };
}

function generateSixSsPainPoints(answers, occupation) {
  const sixSs = ['Significance', 'Safe', 'Supported', 'Successful', 'Surprise-and-delight', 'Sharing'];
  
  const painPointTemplates = {
    Significance: [
      'Feels overlooked and undervalued in their current role despite their contributions',
      'Struggles to get recognition for their expertise and innovative ideas',
      'Wants to be seen as a thought leader but lacks the platform to showcase their knowledge',
      'Feels invisible in networking situations and industry events'
    ],
    Safe: [
      'Worries about financial security and whether their current income is sustainable',
      'Fears making the wrong business decisions that could jeopardize their stability',
      'Anxious about taking risks that might threaten their current comfortable position',
      'Concerned about market changes affecting their job security or business'
    ],
    Supported: [
      'Feels isolated and lacks a strong professional network or mentorship',
      'Struggles without access to expert guidance when facing complex challenges',
      'Wishes they had a community of like-minded professionals to learn from',
      'Feels like they have to figure everything out alone without proper support systems'
    ],
    Successful: [
      'Frustrated by slow progress toward their definition of professional success',
      'Compares themselves to others and feels behind in achieving their goals',
      'Unclear about what metrics truly define success in their field',
      'Struggles to maintain consistent momentum toward their biggest objectives'
    ],
    'Surprise-and-delight': [
      'Stuck in repetitive routines that lack excitement and growth opportunities',
      'Craves new challenges but feels trapped in predictable daily patterns',
      'Wants to experience breakthrough moments but unsure how to create them',
      'Feels their work has become mundane and lacks the spark it once had'
    ],
    Sharing: [
      'Wants to make a meaningful impact but struggles to find the right channels',
      'Has valuable knowledge to share but lacks confidence in their teaching abilities',
      'Desires to give back to their community but unsure how to get started',
      'Feels their success would be more fulfilling if they could help others achieve similar results'
    ]
  };

  const result = {};
  
  sixSs.forEach(feeling => {
    const templates = painPointTemplates[feeling];
    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    // Customize based on occupation and answers
    let customizedPainPoint = selectedTemplate;
    if (occupation.includes('Owner') || occupation.includes('Founder')) {
      customizedPainPoint = customizedPainPoint.replace('their current role', 'their business');
      customizedPainPoint = customizedPainPoint.replace('job security', 'business stability');
    }
    
    result[feeling] = customizedPainPoint;
  });

  return result;
}

function getContextualOccupation(answers) {
  if (answers.icpDesire?.toLowerCase().includes('entrepreneur') || answers.icpDesire?.toLowerCase().includes('business')) {
    return ['Small Business Owner', 'Startup Founder', 'Independent Consultant', 'Freelance Professional', 'Agency Owner', 'E-commerce Entrepreneur'];
  }
  if (answers.icpDesire?.toLowerCase().includes('coach') || answers.icpDesire?.toLowerCase().includes('consultant')) {
    return ['Business Coach', 'Life Coach', 'Marketing Consultant', 'Strategy Consultant', 'Executive Coach', 'Leadership Consultant'];
  }
  if (answers.icpDesire?.toLowerCase().includes('corporate') || answers.icpDesire?.toLowerCase().includes('executive')) {
    return ['Corporate Executive', 'Sales Director', 'Marketing Manager', 'Operations Manager', 'VP of Sales', 'Department Head'];
  }
  return ['Business Professional', 'Project Manager', 'Team Leader', 'Senior Analyst', 'Operations Specialist', 'Business Development Manager'];
}

function getAvatarImage(gender, name) {
  const seed = name.toLowerCase().replace(/\s+/g, '');
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}
