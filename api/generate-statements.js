export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, userId } = req.body;

    // Generate contextual statements based on user's answers
    const solutionStatement = `For ${getTargetAudience(answers)} who ${getProblemPhrase(answers)}, our ${answers.uniqueFramework || 'proven system'} provides the exact roadmap to ${getOutcomePhrase(answers)} ${getResultPhrase(answers)}.`;

    const uspStatement = `Unlike other programs that ${getCompetitorProblem(answers)}, our ${answers.uniqueFramework || 'unique approach'} delivers ${answers.promisedResult || 'guaranteed results'} by focusing specifically on ${answers.fourDesires || 'what matters most'} through our ${answers.sixSs || 'proven'} methodology.`;

    return res.status(200).json({
      statements: {
        solutionStatement: solutionStatement,
        uspStatement: uspStatement
      },
      userId: userId
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to generate statements',
      details: error.message 
    });
  }
}

function getTargetAudience(answers) {
  if (answers.icpDesire?.includes('entrepreneur')) return 'ambitious entrepreneurs';
  if (answers.icpDesire?.includes('business')) return 'business owners';
  if (answers.icpDesire?.includes('freedom')) return 'freedom-seeking professionals';
  return 'motivated individuals';
}

function getProblemPhrase(answers) {
  if (answers.currentProblem) {
    return answers.currentProblem.toLowerCase()
      .replace('they feel like ', '')
      .replace('they believe that ', '')
      .replace('they ', '');
  }
  return 'struggle with common challenges';
}

function getOutcomePhrase(answers) {
  if (answers.icpDestination) {
    return answers.icpDestination.toLowerCase()
      .replace('they have ', '')
      .replace('they work ', '')
      .replace('they enjoy ', '')
      .replace('they ', '');
  }
  return 'achieve their goals';
}

function getResultPhrase(answers) {
  if (answers.promisedResult) {
    return answers.promisedResult.toLowerCase()
      .replace('they can ', '')
      .replace('they will ', '')
      .replace('they get ', '')
      .replace('they ', '');
  }
  return 'faster than ever before';
}

function getCompetitorProblem(answers) {
  if (answers.currentProblem) {
    return answers.currentProblem.toLowerCase()
      .replace('they feel like ', 'leave you feeling like ')
      .replace('they believe that ', 'make you believe ')
      .replace('they ', 'leave you ');
  }
  return 'leave you overwhelmed and confused';
}
