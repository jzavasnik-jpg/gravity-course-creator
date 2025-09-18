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
  
  const painPoints = generatePainPoints(answers);

  return {
    name: name,
    age: age,
    income: income,
    location: location,
    occupation: occupation,
    imageUrl: getAvatarImage(gender, name),
    painPoints: painPoints
  };
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

function generatePainPoints(answers) {
  const basePainPoints = {
    timeManagement: 'Struggles with work-life balance and effective time management',
    scaling: 'Difficulty scaling their business or advancing their career to the next level',
    confidence: 'Lacks confidence in their ability to achieve bigger goals and take risks',
    overwhelm: 'Feels overwhelmed by conflicting advice and too many strategy options',
    systemization: 'Trouble creating repeatable systems and processes for growth'
  };
  
  // Add contextual pain points based on user answers
  if (answers.currentProblem) {
    basePainPoints.specificChallenge = answers.currentProblem
      .replace(/^they feel like /i, 'Often feels like ')
      .replace(/^they believe that /i, 'Believes ')
      .replace(/^they /i, '')
      .replace(/\.$/, '');
  }
  
  if (answers.icpDesire) {
    if (answers.icpDesire.toLowerCase().includes('freedom')) {
      basePainPoints.freedomBarrier = 'Wants more freedom but feels trapped by current obligations and responsibilities';
    }
    if (answers.icpDesire.toLowerCase().includes('income') || answers.icpDesire.toLowerCase().includes('money')) {
      basePainPoints.incomeGrowth = 'Desires higher income but unsure how to increase earning potential sustainably';
    }
  }
  
  return basePainPoints;
}

function getAvatarImage(gender, name) {
  // Using placeholder avatar service that generates consistent images based on name
  const seed = name.toLowerCase().replace(/\s+/g, '');
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}
