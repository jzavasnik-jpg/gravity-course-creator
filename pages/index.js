// pages/index.js
import React, { useState, useEffect } from 'react';

const App = () => {
  const [step, setStep] = useState(0);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState(null);
  const [showNavDropdown, setShowNavDropdown] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isInputDisabled, setIsInputDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({
    icpDesire: '',
    icpDecision: '',
    currentProblem: '',
    icpDestination: '',
    uniqueFramework: '',
    fourDesires: '',
    sixSs: '',
    promisedResult: ''
  });
  const [generatedStatements, setGeneratedStatements] = useState({
    solutionStatement: '',
    uspStatement: ''
  });
  const [generatedStatementsHistory, setGeneratedStatementsHistory] = useState([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [isEditing, setIsEditing] = useState({
    solution: false,
    usp: false
  });
  const [apiError, setApiError] = useState('');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [avatars, setAvatars] = useState({
    male: {
      name: '',
      age: '',
      income: '',
      location: '',
      occupation: '',
      imageUrl: '',
      painPoints: {},
      painPointsGenerated: false
    },
    female: {
      name: '',
      age: '',
      income: '',
      location: '',
      occupation: '',
      imageUrl: '',
      painPoints: {},
      painPointsGenerated: false
    }
  });
  const [isGeneratingAvatars, setIsGeneratingAvatars] = useState(false);
  const [courseOutline, setCourseOutline] = useState(null);
  const [isGeneratingCourse, setIsGeneratingCourse] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);

  // Simulate Firebase authentication and data storage
  const initializeUser = async () => {
    try {
      // Check if user exists in localStorage (simulating Firebase Auth)
      let storedUserId = localStorage.getItem('gravity_user_id');
      let storedProfile = localStorage.getItem('gravity_user_profile');

      if (!storedUserId) {
        // Create new anonymous user
        storedUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('gravity_user_id', storedUserId);
      }

      setUserId(storedUserId);

      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        setUserProfile(profile);
        setUserName(profile.firstName || '');
        setUserAnswers(profile.userAnswers || userAnswers);
        setStep(profile.step || 0);
        
        // Load statement history
        if (profile.generatedStatementsHistory && profile.generatedStatementsHistory.length > 0) {
          setGeneratedStatementsHistory(profile.generatedStatementsHistory);
          setCurrentHistoryIndex(profile.generatedStatementsHistory.length - 1);
          setGeneratedStatements(profile.generatedStatementsHistory[profile.generatedStatementsHistory.length - 1]);
        }

        // Load avatars
        if (profile.avatars) {
          setAvatars(profile.avatars);
        }

        // Load course outline
        if (profile.courseOutline) {
          setCourseOutline(profile.courseOutline);
        }
      }

      setIsAuthReady(true);
    } catch (error) {
      console.error('Error initializing user:', error);
      setIsAuthReady(true);
    }
  };

  // Save user data (simulating Firebase Firestore)
  const saveUserData = async (updates) => {
    if (!userId) return;

    try {
      const currentProfile = userProfile || {};
      const updatedProfile = {
        ...currentProfile,
        ...updates,
        userId,
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem('gravity_user_profile', JSON.stringify(updatedProfile));
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  // Initialize user on app load
  useEffect(() => {
    initializeUser();
  }, []);

  // Fixed suggestions for steps 6 & 7 (don't need AI for these)
  const fixedSuggestions = {
    6: [
      { label: 'Money', description: 'The desire for financial freedom, wealth, and security.' },
      { label: 'Time', description: 'The desire for more freedom, efficiency, and a better work-life balance.' },
      { label: 'Experiences', description: 'The desire for personal growth, adventure, and new challenges.' },
      { label: 'Relationships', description: 'The desire for deeper connections with others, community, or a romantic partner.' }
    ],
    7: [
      { label: 'Significance', description: 'The desire to be seen, heard, and acknowledged as important.' },
      { label: 'Safe', description: 'The desire for security, protection, and stability.' },
      { label: 'Supported', description: 'The desire to feel cared for, understood, and part of a community.' },
      { label: 'Successful', description: 'The desire for accomplishment, achievement, and recognition.' },
      { label: 'Surprise-and-delight', description: 'The desire for novelty, unexpected joy, and excitement.' },
      { label: 'Sharing', description: 'The desire to contribute, give back, and be a positive force in the world.' }
    ]
  };

  // Create prompts for each step that will be sent to Gemini AI
  const createPromptForStep = (stepNumber, previousAnswers) => {
    const baseInstruction = "You are an expert marketing strategist helping create an Ideal Client Profile. Generate 4-5 realistic, specific suggestions that sound natural and human. Return ONLY a JSON array of strings, no other text or formatting.";
    
    switch (stepNumber) {
      case 1:
        return `${baseInstruction}
        
Question: What is your ideal client's deepest desire?
Format each suggestion as a complete sentence starting with "They want to" or "They desire to" or "They crave".
Focus on deep emotional needs like freedom, recognition, security, growth, impact, or fulfillment.
Make them specific to business/entrepreneurship context.

Example format: ["They want to achieve financial freedom and escape the 9-5 grind", "They desire to build a meaningful business that makes a real impact"]`;

      case 2:
        return `${baseInstruction}
        
Based on this ideal client's deepest desire: "${previousAnswers.icpDesire}"

Question: What key decision have they made or are about to make?
Format each suggestion as a complete sentence starting with "They've decided to" or "They've chosen to" or "They've committed to".
Make the decisions logically connected to their desire.

Example format: ["They've decided to start their own consulting business", "They've chosen to invest in digital marketing education"]`;

      case 3:
        return `${baseInstruction}
        
Based on their desire: "${previousAnswers.icpDesire}"
And their decision: "${previousAnswers.icpDecision}"

Question: What is one thing they're currently feeling or believing that is NOT working?
Format each suggestion as "They feel like..." or "They believe that..." 
Focus on current frustrations, limiting beliefs, or obstacles preventing them from reaching their desire.

Example format: ["They feel like they're spinning their wheels without real progress", "They believe they lack the technical skills to succeed online"]`;

      case 4:
        return `${baseInstruction}
        
Based on their current problem: "${previousAnswers.currentProblem}"
And their original desire: "${previousAnswers.icpDesire}"

Question: What does their ultimate destination or 'after' state look like?
Format each suggestion starting with "They have" or "They've built" or "They work" or "They enjoy".
Paint a picture of their ideal future state - be specific and inspiring.

Example format: ["They have a thriving 6-figure business that runs without them", "They work only 20 hours per week while maintaining their income"]`;

      case 5:
        return `${baseInstruction}
        
Based on their destination: "${previousAnswers.icpDestination}"

Question: What is a unique framework or methodology that could help them get there?
Return a JSON array of objects with "name" and "description" properties.
Make the names catchy, memorable, and related to the problem. Descriptions should be one detailed sentence.

Example format: [{"name": "The Freedom Formula", "description": "A step-by-step system for creating passive income streams that work 24/7."}, {"name": "The Authority Accelerator", "description": "A unique framework for rapidly establishing expertise and credibility in any field."}]`;

      case 8:
        return `${baseInstruction}
        
Based on their unique framework: "${previousAnswers.uniqueFramework}"
And their destination: "${previousAnswers.icpDestination}"

Question: What specific result can you promise that's faster, easier, or more complete than competitors?
Format each suggestion starting with "They can" or "They will" or "They get".
Focus on speed, ease, or completeness advantages.

Example format: ["They can build a profitable business 3x faster than traditional methods", "They get results in 90 days or less with our proven system"]`;

      default:
        return '';
    }
  };

  // Call the API endpoint for suggestions
  const fetchSuggestions = async () => {
    // Skip API calls for fixed suggestion steps
    if (step === 6 || step === 7) {
      setSuggestions(fixedSuggestions[step] || []);
      return;
    }

    // Skip if no valid step
    if (step < 1 || step > 8 || step === 6 || step === 7) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    setApiError('');
    
    try {
      const prompt = createPromptForStep(step, userAnswers);
      
      const response = await fetch('/api/generate-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          step,
          userId,
          userAnswers: userAnswers || {}
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setSuggestions(data.suggestions || []);
      
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setApiError(`Failed to load suggestions: ${error.message}`);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // NEW: Step 1 - Generate basic avatar profiles
  const generateAvatarProfiles = async () => {
    setIsGeneratingAvatars(true);
    setApiError('');

    try {
      const response = await fetch('/api/generate-avatar-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: userAnswers,
          statements: generatedStatements,
          userId
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Update avatars with basic profile info (no pain points yet)
      setAvatars(data.avatars);

      // Save basic avatar data
      await saveUserData({
        avatars: data.avatars,
        step: 10
      });

      setStep(10);
      
    } catch (error) {
      console.error('Error generating avatar profiles:', error);
      setApiError(`Failed to generate avatar profiles: ${error.message}`);
    } finally {
      setIsGeneratingAvatars(false);
    }
  };

  // NEW: Step 2 - Generate pain points for a specific avatar
  const generatePainPoints = async (gender, avatarData) => {
    setIsGeneratingAvatars(true);
    setApiError('');

    try {
      const response = await fetch('/api/generate-pain-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: userAnswers,
          statements: generatedStatements,
          avatarProfile: avatarData,
          gender: gender,
          userId
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Update the specific avatar with pain points
      const updatedAvatars = {
        ...avatars,
        [gender]: {
          ...avatars[gender],
          sixSsPainPoints: data.painPoints,
          painPointsGenerated: true
        }
      };
      
      setAvatars(updatedAvatars);
      
      // Save updated avatar data
      await saveUserData({
        avatars: updatedAvatars
      });
      
    } catch (error) {
      console.error(`Error generating pain points for ${gender}:`, error);
      setApiError(`Failed to generate pain points for ${gender}: ${error.message}`);
    } finally {
      setIsGeneratingAvatars(false);
    }
  };

  // NEW: Step 3 - Regenerate specific pain point
  const regeneratePainPoint = async (gender, sCategory) => {
    setApiError('');

    try {
      const response = await fetch('/api/regenerate-pain-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: userAnswers,
          statements: generatedStatements,
          avatarProfile: avatars[gender],
          gender: gender,
          sCategory: sCategory,
          userId
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Update the specific pain point
      const updatedAvatars = {
        ...avatars,
        [gender]: {
          ...avatars[gender],
          sixSsPainPoints: {
            ...avatars[gender].sixSsPainPoints,
            [sCategory]: data.painPoint
          }
        }
      };
      
      setAvatars(updatedAvatars);
      
      // Save updated avatar data
      await saveUserData({
        avatars: updatedAvatars
      });
      
    } catch (error) {
      console.error(`Error regenerating pain point:`, error);
      setApiError(`Failed to regenerate pain point: ${error.message}`);
    }
  };

  // NEW: Update pain point directly (for editing)
  const updatePainPoint = async (gender, sCategory, newPainPoint) => {
    const updatedAvatars = {
      ...avatars,
      [gender]: {
        ...avatars[gender],
        sixSsPainPoints: {
          ...avatars[gender].sixSsPainPoints,
          [sCategory]: newPainPoint
        }
      }
    };
    
    setAvatars(updatedAvatars);
    
    // Save updated avatar data
    await saveUserData({
      avatars: updatedAvatars
    });
  };

  // Generate course outline
  const generateCourse = async () => {
    setIsGeneratingCourse(true);
    setApiError('');

    try {
      const response = await fetch('/api/generate-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: userAnswers,
          statements: generatedStatements,
          avatars: avatars,
          userId
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setCourseOutline(data.course);

      // Save to user profile
      await saveUserData({
        courseOutline: data.course,
        step: 11
      });

      setStep(11);
      
    } catch (error) {
      console.error('Error generating course:', error);
      setApiError(`Failed to generate course: ${error.message}`);
    } finally {
      setIsGeneratingCourse(false);
    }
  };

  // Regenerate individual module
  const regenerateModule = async (moduleIndex) => {
    setIsGeneratingCourse(true);
    setApiError('');

    try {
      const response = await fetch('/api/regenerate-module', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: userAnswers,
          statements: generatedStatements,
          avatars: avatars,
          moduleIndex: moduleIndex,
          existingCourse: courseOutline,
          userId
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Update the specific module
      const updatedCourse = { ...courseOutline };
      updatedCourse.modules[moduleIndex] = data.module;
      setCourseOutline(updatedCourse);

      // Save to user profile
      await saveUserData({
        courseOutline: updatedCourse
      });
      
    } catch (error) {
      console.error('Error regenerating module:', error);
      setApiError(`Failed to regenerate module: ${error.message}`);
    } finally {
      setIsGeneratingCourse(false);
    }
  };

  // Update course content directly
  const updateCourseContent = async (moduleIndex, lessonIndex, field, value) => {
    const updatedCourse = { ...courseOutline };
    
    if (lessonIndex !== null) {
      // Updating a lesson
      updatedCourse.modules[moduleIndex].lessons[lessonIndex][field] = value;
    } else {
      // Updating a module
      updatedCourse.modules[moduleIndex][field] = value;
    }
    
    setCourseOutline(updatedCourse);
    
    // Save to user profile
    await saveUserData({
      courseOutline: updatedCourse
    });
  };
// Regenerate individual lesson
const regenerateLesson = async (moduleIndex, lessonIndex) => {
  setIsGeneratingCourse(true);
  setApiError('');

  try {
    const response = await fetch('/api/regenerate-lesson', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answers: userAnswers,
        statements: generatedStatements,
        avatars: avatars,
        courseData: courseOutline,
        moduleIndex,
        lessonIndex,
        userId
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    // Update the specific lesson
    const updatedCourse = { ...courseOutline };
    updatedCourse.modules[moduleIndex].lessons[lessonIndex] = data.lesson;
    setCourseOutline(updatedCourse);

    // Save to user profile
    await saveUserData({
      courseOutline: updatedCourse
    });
    
  } catch (error) {
    console.error('Error regenerating lesson:', error);
    setApiError(`Failed to regenerate lesson: ${error.message}`);
  } finally {
    setIsGeneratingCourse(false);
  }
};
  // Generate final marketing statements with history tracking
  const generateStatements = async (answers) => {
    setIsLoading(true);
    setApiError('');

    try {
      const response = await fetch('/api/generate-statements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          userId
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Add to history
      const newStatements = data.statements;
      const newHistory = [...generatedStatementsHistory, newStatements];
      
      setGeneratedStatements(newStatements);
      setGeneratedStatementsHistory(newHistory);
      setCurrentHistoryIndex(newHistory.length - 1);

      // Save to user profile
      await saveUserData({
        firstName: userName,
        userAnswers: answers,
        generatedStatementsHistory: newHistory,
        step: 9
      });

      setStep(9);
      
    } catch (error) {
      console.error('Error generating statements:', error);
      setApiError(`Failed to generate statements: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Regenerate individual statements
  const regenerateStatement = async (statementType) => {
    setIsLoading(true);
    setApiError('');

    try {
      const response = await fetch('/api/regenerate-statement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: userAnswers,
          statementType,
          userId
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Update the current statement
      const updatedStatements = { ...generatedStatements };
      if (statementType === 'solution') {
        updatedStatements.solutionStatement = data.statement;
      } else {
        updatedStatements.uspStatement = data.statement;
      }

      // Add to history
      const newHistory = [...generatedStatementsHistory, updatedStatements];
      
      setGeneratedStatements(updatedStatements);
      setGeneratedStatementsHistory(newHistory);
      setCurrentHistoryIndex(newHistory.length - 1);

      // Save to user profile
      await saveUserData({
        generatedStatementsHistory: newHistory
      });
      
    } catch (error) {
      console.error('Error regenerating statement:', error);
      setApiError(`Failed to regenerate statement: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate through statement history
  const navigateHistory = (direction) => {
    const newIndex = currentHistoryIndex + direction;
    if (newIndex >= 0 && newIndex < generatedStatementsHistory.length) {
      setCurrentHistoryIndex(newIndex);
      setGeneratedStatements(generatedStatementsHistory[newIndex]);
    }
  };

  // Save edited statements
  const saveEditedStatements = async () => {
    if (currentHistoryIndex >= 0) {
      const updatedHistory = [...generatedStatementsHistory];
      updatedHistory[currentHistoryIndex] = generatedStatements;
      setGeneratedStatementsHistory(updatedHistory);
      
      await saveUserData({
        generatedStatementsHistory: updatedHistory
      });
    }
    setIsEditing({ solution: false, usp: false });
  };

  const goToStep = async (targetStep) => {
    // Save current progress before navigating
    await saveUserData({
      firstName: userName,
      userAnswers: userAnswers,
      step: targetStep
    });
    
    setStep(targetStep);
    setInputValue('');
    setIsInputDisabled(false);
    setShowSuggestions(true);
  };

  // Fetch suggestions when step changes
  useEffect(() => {
    if (step > 0 && step <= 8 && isAuthReady) {
      fetchSuggestions();
    }
  }, [step, isAuthReady]);

  const questions = [
    "What is your ideal client's deepest desire? (The core tension they feel). For best results, please be as detailed as possible.",
    "What is the decision they've made (or are about to make)?",
    "What is the one thing your audience is currently feeling or believing that is not working? (This gets to the core of their current problem and sets up the 'before' state).",
    "What is their ultimate destination? (What does their 'after' look like?).",
    "What is the unique framework, tool, or principle you use to solve their problem that no one else has?",
    "Which of the Four Core Desire-Markets does your ideal client's desire fall under?",
    "Which of the Six 'S's of Emotional Experience Architecture is the PRIMARY emotion that your solution will help your client feel?",
    "What specific result do you promise that is faster, easier, or more complete than what's available from your competitors?",
  ];

  const handleNextStep = async () => {
    let updatedAnswers = { ...userAnswers };
    
    switch (step) {
      case 1: updatedAnswers.icpDesire = inputValue; break;
      case 2: updatedAnswers.icpDecision = inputValue; break;
      case 3: updatedAnswers.currentProblem = inputValue; break;
      case 4: updatedAnswers.icpDestination = inputValue; break;
      case 5: updatedAnswers.uniqueFramework = inputValue; break;
      case 6: updatedAnswers.fourDesires = inputValue; break;
      case 7: updatedAnswers.sixSs = inputValue; break;
      case 8:
        updatedAnswers.promisedResult = inputValue;
        setUserAnswers(updatedAnswers);
        generateStatements(updatedAnswers);
        setInputValue('');
        return;
      default:
        break;
    }
    
    setUserAnswers(updatedAnswers);
    
    // Save progress to user profile
    await saveUserData({
      firstName: userName,
      userAnswers: updatedAnswers,
      step: step + 1
    });
    
    setInputValue('');
    setIsInputDisabled(false);
    setShowSuggestions(true);
    setStep(step + 1);
  };

  const handleSuggestionClick = (suggestion) => {
    if (step === 6 || step === 7) {
      setInputValue(suggestion.label || suggestion);
      setIsInputDisabled(true);
    } else if (step === 5) {
      // For step 5, suggestion should be an object with name and description
      const frameworkName = typeof suggestion === 'object' ? suggestion.name : suggestion;
      setInputValue(prev => {
        if (prev.trim() === '') {
          return frameworkName;
        } else {
          return prev + '\n\n' + frameworkName;
        }
      });
    } else {
      // For other steps, allow multiple selections
      const suggestionText = typeof suggestion === 'object' ? suggestion.label || suggestion.name : suggestion;
      setInputValue(prev => {
        if (prev.trim() === '') {
          return suggestionText;
        } else {
          // Add as a new paragraph if it's not already included
          if (!prev.includes(suggestionText)) {
            return prev + '\n\n' + suggestionText;
          }
          return prev;
        }
      });
    }
  };

  const saveUserName = async () => {
    if (userName.trim()) {
      await saveUserData({
        firstName: userName,
        step: 1
      });
      setStep(1);
      setInputValue('');
    }
  };

  // NEW: PainPointRow component
  const PainPointRow = ({ gender, feeling, painPoint, onRegenerate, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(painPoint);
    const [isRegenerating, setIsRegenerating] = useState(false);

    const handleSave = () => {
      onUpdate(editValue);
      setIsEditing(false);
    };

    const handleCancel = () => {
      setEditValue(painPoint);
      setIsEditing(false);
    };

    const handleRegenerate = async () => {
      setIsRegenerating(true);
      await onRegenerate();
      setIsRegenerating(false);
    };

    return (
      <tr className="hover:bg-slate-25">
        <td className="border border-slate-300 px-4 py-3 font-medium text-slate-700 align-top">
          {feeling}
        </td>
        <td className="border border-slate-300 px-4 py-3 text-slate-600 leading-relaxed">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            painPoint
          )}
        </td>
        <td className="border border-slate-300 px-2 py-3 text-center">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setIsEditing(!isEditing)}
              disabled={isEditing}
              className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs hover:bg-slate-200 disabled:opacity-50"
            >
              {isEditing ? 'Editing...' : 'Edit'}
            </button>
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating || isEditing}
              className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 disabled:opacity-50"
            >
              {isRegenerating ? 'Gen...' : 'Regen'}
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // Show loading while authenticating
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Initializing your session...</p>
        </div>
      </div>
    );
  }

  const renderInputPanel = () => {
    if (step === 0) {
      const isReturningUser = userProfile && userProfile.firstName && userProfile.step > 0;
      
      return (
        <div className="h-full flex flex-col">
          <div className="mb-8">
            <div className="text-lg text-slate-600 mb-4">
              Welcome to The Gravity Course Creator
            </div>
            {isReturningUser ? (
              <>
                <h2 className="text-2xl font-bold mb-4 text-slate-800">Welcome back, {userProfile.firstName}!</h2>
                <p className="text-slate-600 mb-4">Would you like to continue where you left off?</p>
                <div className="space-y-3">
                  <button
                    onClick={() => setStep(userProfile.step)}
                    className="w-full px-6 py-3 font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Continue from Step {userProfile.step}
                  </button>
                  <button
                    onClick={async () => {
                      setUserName('');
                      setStep(0);
                      setUserAnswers({
                        icpDesire: '', icpDecision: '', currentProblem: '', icpDestination: '',
                        uniqueFramework: '', fourDesires: '', sixSs: '', promisedResult: ''
                      });
                      // Clear localStorage and reset profile
                      localStorage.removeItem('gravity_user_profile');
                      setUserProfile(null);
                      setGeneratedStatements({ solutionStatement: '', uspStatement: '' });
                      setGeneratedStatementsHistory([]);
                      setCurrentHistoryIndex(-1);
                    }}
                    className="w-full px-6 py-3 font-semibold bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-all duration-300"
                  >
                    Start Over
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-4 text-slate-800">What should we call you?</h2>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your first name..."
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
                />
                <button
                  onClick={saveUserName}
                  disabled={!userName.trim()}
                  className={`w-full mt-4 px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${
                    userName.trim() 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Let's Go!
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    if (step === 9) {
      return (
        <div className="h-full flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Generated Statements</h2>
            {generatedStatementsHistory.length > 1 && (
              <div className="text-sm text-slate-600">
                Version {currentHistoryIndex + 1} of {generatedStatementsHistory.length}
              </div>
            )}
          </div>

          {/* Solution Statement Card */}
          <div className="border border-slate-200 rounded-lg p-6 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800 text-lg">Solution Statement</h3>
                <p className="text-sm text-slate-600">Three-verb alliteration from your point of view</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => regenerateStatement('solution')}
                  disabled={isLoading}
                  className="text-sm px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Regenerating...' : 'Regenerate'}
                </button>
                {generatedStatementsHistory.length > 1 && (
                  <>
                    <button
                      onClick={() => navigateHistory(-1)}
                      disabled={currentHistoryIndex <= 0}
                      className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => navigateHistory(1)}
                      disabled={currentHistoryIndex >= generatedStatementsHistory.length - 1}
                      className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      Next →
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    if (isEditing.solution) {
                      saveEditedStatements();
                    }
                    setIsEditing({...isEditing, solution: !isEditing.solution});
                  }}
                  className="text-sm px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                >
                  {isEditing.solution ? 'Save' : 'Edit'}
                </button>
              </div>
            </div>
            
            {isEditing.solution ? (
              <div className="space-y-3">
                <textarea
                  value={generatedStatements.solutionStatement}
                  onChange={(e) => setGeneratedStatements({
                    ...generatedStatements,
                    solutionStatement: e.target.value
                  })}
                  className="w-full h-32 p-4 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your solution statement..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      saveEditedStatements();
                      setIsEditing({...isEditing, solution: false});
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      // Revert to current history version
                      if (currentHistoryIndex >= 0) {
                        setGeneratedStatements(generatedStatementsHistory[currentHistoryIndex]);
                      }
                      setIsEditing({...isEditing, solution: false});
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-800 leading-relaxed text-lg font-medium">
                  {generatedStatements.solutionStatement || 'No solution statement generated yet.'}
                </p>
              </div>
            )}
          </div>

          {/* USP Statement Card */}
          <div className="border border-slate-200 rounded-lg p-6 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800 text-lg">USP Statement</h3>
                <p className="text-sm text-slate-600">Unique selling proposition with key mechanism</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => regenerateStatement('usp')}
                  disabled={isLoading}
                  className="text-sm px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Regenerating...' : 'Regenerate'}
                </button>
                {generatedStatementsHistory.length > 1 && (
                  <>
                    <button
                      onClick={() => navigateHistory(-1)}
                      disabled={currentHistoryIndex <= 0}
                      className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => navigateHistory(1)}
                      disabled={currentHistoryIndex >= generatedStatementsHistory.length - 1}
                      className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      Next →
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    if (isEditing.usp) {
                      saveEditedStatements();
                    }
                    setIsEditing({...isEditing, usp: !isEditing.usp});
                  }}
                  className="text-sm px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                >
                  {isEditing.usp ? 'Save' : 'Edit'}
                </button>
              </div>
            </div>
            
            {isEditing.usp ? (
              <div className="space-y-3">
                <textarea
                  value={generatedStatements.uspStatement}
                  onChange={(e) => setGeneratedStatements({
                    ...generatedStatements,
                    uspStatement: e.target.value
                  })}
                  className="w-full h-32 p-4 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your USP statement..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      saveEditedStatements();
                      setIsEditing({...isEditing, usp: false});
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      // Revert to current history version
                      if (currentHistoryIndex >= 0) {
                        setGeneratedStatements(generatedStatementsHistory[currentHistoryIndex]);
                      }
                      setIsEditing({...isEditing, usp: false});
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-800 leading-relaxed text-lg font-medium">
                  {generatedStatements.uspStatement || 'No USP statement generated yet.'}
                </p>
              </div>
            )}
          </div>

          {/* Global Statement Actions */}
          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <button
              onClick={() => {
                // Regenerate both statements
                const regenerateAll = async () => {
                  setIsLoading(true);
                  try {
                    const response = await fetch('/api/generate-statements', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ answers: userAnswers, userId })
                    });
                    const data = await response.json();
                    
                    const newStatements = data.statements;
                    const newHistory = [...generatedStatementsHistory, newStatements];
                    
                    setGeneratedStatements(newStatements);
                    setGeneratedStatementsHistory(newHistory);
                    setCurrentHistoryIndex(newHistory.length - 1);
                    
                    await saveUserData({ generatedStatementsHistory: newHistory });
                  } catch (error) {
                    setApiError('Failed to regenerate statements');
                  } finally {
                    setIsLoading(false);
                  }
                };
                regenerateAll();
              }}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Regenerating All...' : 'Regenerate Both Statements'}
            </button>

            {/* UPDATED: Changed to call generateAvatarProfiles */}
            <button
              onClick={generateAvatarProfiles}
              disabled={isGeneratingAvatars || !generatedStatements.solutionStatement || !generatedStatements.uspStatement}
              className={`px-6 py-2 font-semibold rounded-lg transition-all duration-300 ${
                isGeneratingAvatars || !generatedStatements.solutionStatement || !generatedStatements.uspStatement
                  ? 'bg-slate-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isGeneratingAvatars ? 'Generating Avatars...' : 'Continue to Customer Avatars'}
            </button>
          </div>

          {/* Error Display */}
          {apiError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {apiError}
            </div>
          )}
        </div>
      );
    }

    // UPDATED: New Step 10 UI
    if (step === 10) {
      return (
        <div className="h-full flex flex-col space-y-6 overflow-y-auto">
          <h2 className="text-2xl font-bold text-slate-800">Customer Avatars</h2>
          <p className="text-slate-600">
            Detailed customer profiles with emotional pain points mapped to the Six S's framework.
          </p>
          
          <div className="space-y-8">
            {/* Male Avatar */}
            <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                {avatars.male.imageUrl ? (
                  <img 
                    src={avatars.male.imageUrl} 
                    alt={avatars.male.name}
                    className="w-16 h-16 rounded-full bg-slate-100"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                    <span className="text-slate-400 text-sm">Male</span>
                  </div>
                )}
                <div className="flex-1">
                  {avatars.male.name ? (
                    <>
                      <h3 className="font-bold text-xl text-slate-800">{avatars.male.name}</h3>
                      <p className="text-slate-600 text-lg">{avatars.male.occupation}</p>
                      <div className="flex gap-4 mt-1 text-sm text-slate-500">
                        <span>{avatars.male.age}</span>
                        <span>{avatars.male.income}</span>
                        <span>{avatars.male.location}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-500">
                      <p className="font-medium">Male Avatar</p>
                      <p className="text-sm">Profile not generated yet</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {!avatars.male.name ? (
                    <button
                      onClick={() => generateAvatarProfiles()}
                      disabled={isGeneratingAvatars}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                    >
                      {isGeneratingAvatars ? 'Generating...' : 'Generate Profiles'}
                    </button>
                  ) : !avatars.male.painPointsGenerated ? (
                    <button
                      onClick={() => generatePainPoints('male', avatars.male)}
                      disabled={isGeneratingAvatars}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
                    >
                      {isGeneratingAvatars ? 'Generating...' : 'Generate Pain Points'}
                    </button>
                  ) : (
                    <button
                      onClick={() => generatePainPoints('male', avatars.male)}
                      disabled={isGeneratingAvatars}
                      className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
                    >
                      Regenerate Pain Points
                    </button>
                  )}
                </div>
              </div>
              
              {/* Pain Points Table */}
              {avatars.male.sixSsPainPoints && (
                <div className="mt-4">
                  <h4 className="font-semibold text-slate-800 mb-3">Emotional Pain Points (Six S's Framework)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="border border-slate-300 px-4 py-2 text-left font-semibold text-slate-800 w-1/4">Feeling</th>
                          <th className="border border-slate-300 px-4 py-2 text-left font-semibold text-slate-800 w-3/4">Pain Point</th>
                          <th className="border border-slate-300 px-4 py-2 text-center font-semibold text-slate-800 w-16">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(avatars.male.sixSsPainPoints || {}).map(([feeling, painPoint]) => (
                          <PainPointRow 
                            key={feeling}
                            gender="male"
                            feeling={feeling}
                            painPoint={painPoint}
                            onRegenerate={() => regeneratePainPoint('male', feeling)}
                            onUpdate={(newPainPoint) => updatePainPoint('male', feeling, newPainPoint)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Female Avatar */}
            <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                {avatars.female.imageUrl ? (
                  <img 
                    src={avatars.female.imageUrl} 
                    alt={avatars.female.name}
                    className="w-16 h-16 rounded-full bg-slate-100"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                    <span className="text-slate-400 text-sm">Female</span>
                  </div>
                )}
                <div className="flex-1">
                  {avatars.female.name ? (
                    <>
                      <h3 className="font-bold text-xl text-slate-800">{avatars.female.name}</h3>
                      <p className="text-slate-600 text-lg">{avatars.female.occupation}</p>
                      <div className="flex gap-4 mt-1 text-sm text-slate-500">
                        <span>{avatars.female.age}</span>
                        <span>{avatars.female.income}</span>
                        <span>{avatars.female.location}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-500">
                      <p className="font-medium">Female Avatar</p>
                      <p className="text-sm">Profile not generated yet</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {avatars.female.name && !avatars.female.painPointsGenerated && (
                    <button
                      onClick={() => generatePainPoints('female', avatars.female)}
                      disabled={isGeneratingAvatars}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
                    >
                      {isGeneratingAvatars ? 'Generating...' : 'Generate Pain Points'}
                    </button>
                  )}
                  {avatars.female.painPointsGenerated && (
                    <button
                      onClick={() => generatePainPoints('female', avatars.female)}
                      disabled={isGeneratingAvatars}
                      className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
                    >
                      Regenerate Pain Points
                    </button>
                  )}
                </div>
              </div>
              
              {/* Pain Points Table */}
              {avatars.female.sixSsPainPoints && (
                <div className="mt-4">
                  <h4 className="font-semibold text-slate-800 mb-3">Emotional Pain Points (Six S's Framework)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="border border-slate-300 px-4 py-2 text-left font-semibold text-slate-800 w-1/4">Feeling</th>
                          <th className="border border-slate-300 px-4 py-2 text-left font-semibold text-slate-800 w-3/4">Pain Point</th>
                          <th className="border border-slate-300 px-4 py-2 text-center font-semibold text-slate-800 w-16">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(avatars.female.sixSsPainPoints || {}).map(([feeling, painPoint]) => (
                          <PainPointRow 
                            key={feeling}
                            gender="female"
                            feeling={feeling}
                            painPoint={painPoint}
                            onRegenerate={() => regeneratePainPoint('female', feeling)}
                            onUpdate={(newPainPoint) => updatePainPoint('female', feeling, newPainPoint)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Continue Button */}
          {avatars.male.painPointsGenerated && avatars.female.painPointsGenerated && (
            <button
              onClick={generateCourse}
              disabled={isGeneratingCourse}
              className={`px-6 py-3 font-semibold rounded-lg transition-colors ${
                isGeneratingCourse
                  ? 'bg-slate-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isGeneratingCourse ? 'Generating Course...' : 'Generate Course Outline'}
            </button>
          )}

          {/* Error Display */}
          {apiError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {apiError}
            </div>
          )}
        </div>
      );
    }

    if (step === 11) {
      return (
        <div className="h-full flex flex-col space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Course Structure Generated</h2>
            <div className="flex gap-2">
              <button
                onClick={generateCourse}
                disabled={isGeneratingCourse}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
              >
                {isGeneratingCourse ? 'Regenerating...' : 'Regenerate Structure'}
              </button>
            </div>
          </div>
          
          {courseOutline ? (
            <div className="space-y-6">
              {/* Course Header */}
              <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-800 mb-2">{courseOutline.title}</h3>
                <p className="text-slate-600 mb-4">{courseOutline.description}</p>
                
                {courseOutline.coreBeliefStatement && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Core Belief Statement:</h4>
                    <p className="text-blue-700 italic">"{courseOutline.coreBeliefStatement}"</p>
                  </div>
                )}
                
                <p className="text-sm text-slate-500">Estimated Duration: {courseOutline.estimatedHours}</p>
              </div>

              {/* Lesson Generation Controls */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                <h4 className="font-semibold text-slate-800 mb-3">Generate Detailed Lesson Content</h4>
                <p className="text-slate-600 text-sm mb-4">
                  Your course structure is complete! Now choose how to generate the detailed lesson content with Gravity Culture methodology.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      // Generate all lessons sequentially
                      const generateAllLessons = async () => {
                        setIsGeneratingCourse(true);
                        setApiError('');
                        
                        try {
                          const updatedCourse = { ...courseOutline };
                          
                          for (let moduleIndex = 0; moduleIndex < updatedCourse.modules.length; moduleIndex++) {
                            const module = updatedCourse.modules[moduleIndex];
                            
                            for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex++) {
                              const lesson = module.lessons[lessonIndex];
                              
                              // Skip if lesson already has detailed content
                              if (lesson.hasDetailedContent) continue;
                              
                              const response = await fetch('/api/generate-lesson', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  answers: userAnswers,
                                  statements: generatedStatements,
                                  avatars: avatars,
                                  courseData: courseOutline,
                                  moduleIndex,
                                  lessonIndex,
                                  userId
                                })
                              });
                              
                              if (!response.ok) {
                                throw new Error(`Failed to generate lesson ${lessonIndex + 1} in module ${moduleIndex + 1}`);
                              }
                              
                              const data = await response.json();
                              updatedCourse.modules[moduleIndex].lessons[lessonIndex] = data.lesson;
                            }
                          }
                          
                          setCourseOutline(updatedCourse);
                          await saveUserData({ courseOutline: updatedCourse });
                          
                        } catch (error) {
                          console.error('Error generating all lessons:', error);
                          setApiError(`Failed to generate lessons: ${error.message}`);
                        } finally {
                          setIsGeneratingCourse(false);
                        }
                      };
                      
                      generateAllLessons();
                    }}
                    disabled={isGeneratingCourse}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {isGeneratingCourse ? 'Generating All Lessons...' : 'Generate All Lesson Content'}
                  </button>
                  <div className="text-sm text-slate-500 flex items-center">
                    or generate lessons individually below
                  </div>
                </div>
              </div>

              {/* Modules */}
              <div className="space-y-6">
                {courseOutline.modules && courseOutline.modules.map((module, moduleIndex) => (
                  <div key={moduleIndex} className="bg-white rounded-lg border border-slate-200 shadow-sm">
                    <div className="p-6 border-b border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-bold text-slate-800">
                          Module {moduleIndex + 1}: {module.title}
                        </h4>
                        <button
                          onClick={() => regenerateModule(moduleIndex)}
                          disabled={isGeneratingCourse}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 transition-colors text-sm"
                        >
                          {isGeneratingCourse ? 'Regenerating...' : 'Regenerate Module'}
                        </button>
                      </div>
                      <p className="text-slate-600 mb-2">{module.description}</p>
                      {module.learningObjective && (
                        <p className="text-sm text-purple-700 bg-purple-50 p-2 rounded">
                          <strong>Learning Objective:</strong> {module.learningObjective}
                        </p>
                      )}
                    </div>
                    
                    {/* Lessons */}
                    {module.lessons && module.lessons.length > 0 && (
                      <div className="p-6 space-y-4">
                        <h5 className="font-semibold text-slate-700 mb-4">Lessons:</h5>
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div key={lessonIndex} className="bg-slate-50 rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <h6 className="font-medium text-slate-800 text-lg">{lesson.title}</h6>
                              <div className="flex gap-2">
                                {!lesson.hasDetailedContent ? (
                                  <button
                                    onClick={async () => {
                                      setIsGeneratingCourse(true);
                                      setApiError('');
                                      
                                      try {
                                        const response = await fetch('/api/generate-lesson', {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          },
                                          body: JSON.stringify({
                                            answers: userAnswers,
                                            statements: generatedStatements,
                                            avatars: avatars,
                                            courseData: courseOutline,
                                            moduleIndex,
                                            lessonIndex,
                                            userId
                                          })
                                        });
                                        
                                        if (!response.ok) {
                                          throw new Error(`API call failed: ${response.status}`);
                                        }
                                        
                                        const data = await response.json();
                                        
                                        const updatedCourse = { ...courseOutline };
                                        updatedCourse.modules[moduleIndex].lessons[lessonIndex] = data.lesson;
                                        setCourseOutline(updatedCourse);
                                        
                                        await saveUserData({ courseOutline: updatedCourse });
                                        
                                      } catch (error) {
                                        console.error('Error generating lesson:', error);
                                        setApiError(`Failed to generate lesson: ${error.message}`);
                                      } finally {
                                        setIsGeneratingCourse(false);
                                      }
                                    }}
                                    disabled={isGeneratingCourse}
                                    className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50 transition-colors text-sm"
                                  >
                                    {isGeneratingCourse ? 'Generating...' : 'Generate Content'}
                                  </button>
                                ) : (
  <>
    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm">
      ✓ Content Generated
    </span>
    <button
      onClick={() => regenerateLesson(moduleIndex, lessonIndex)}
      disabled={isGeneratingCourse}
      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 disabled:opacity-50 transition-colors text-sm"
    >
      {isGeneratingCourse ? 'Regenerating...' : 'Regenerate'}
    </button>
  </>
)}
<button
    onClick={() => setEditingLesson(editingLesson === `${moduleIndex}-${lessonIndex}` ? null : `${moduleIndex}-${lessonIndex}`)}
    className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-sm hover:bg-slate-300 transition-colors"
  >
    {editingLesson === `${moduleIndex}-${lessonIndex}` ? 'Close' : 'View'}
  </button>
</div>
                            {/* Detailed Content - Only show if generated and expanded */}
                            {lesson.hasDetailedContent && editingLesson === `${moduleIndex}-${lessonIndex}` && lesson.structure && (
                              <div className="space-y-3 mt-4 border-t pt-4">
                                {/* Origin Story */}
                                {lesson.structure.originStory && (
                                  <div className="bg-green-50 p-3 rounded">
                                    <p className="text-sm font-medium text-green-800 mb-1">Origin Story Hook:</p>
                                    <p className="text-sm text-green-700">{lesson.structure.originStory}</p>
                                  </div>
                                )}

                                {/* False Beliefs */}
                                {lesson.structure.falseBeliefs && lesson.structure.falseBeliefs.length > 0 && (
                                  <div className="bg-red-50 p-3 rounded">
                                    <p className="text-sm font-medium text-red-800 mb-2">False Beliefs to Address:</p>
                                    <ul className="text-sm text-red-700 space-y-1">
                                      {lesson.structure.falseBeliefs.map((belief, index) => (
                                        <li key={index}>• {belief}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Three Secrets */}
                                {lesson.structure.secrets && lesson.structure.secrets.length > 0 && (
                                  <div className="bg-blue-50 p-3 rounded">
                                    <p className="text-sm font-medium text-blue-800 mb-2">Three Secrets Framework:</p>
                                    <div className="space-y-2">
                                      {lesson.structure.secrets.map((secret, index) => (
                                        <div key={index} className="bg-white p-2 rounded border">
                                          <p className="text-sm font-medium text-blue-800">{secret.title}</p>
                                          <p className="text-xs text-blue-600 mb-1">{secret.description}</p>
                                          <p className="text-sm text-blue-700">{secret.explanation}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Tactics */}
                                {lesson.structure.tactics && lesson.structure.tactics.length > 0 && (
                                  <div className="bg-purple-50 p-3 rounded">
                                    <p className="text-sm font-medium text-purple-800 mb-2">Implementation Tactics:</p>
                                    <ul className="text-sm text-purple-700 space-y-1">
                                      {lesson.structure.tactics.map((tactic, index) => (
                                        <li key={index}>• {tactic}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Exercise */}
                                {lesson.structure.exercise && (
                                  <div className="bg-orange-50 p-3 rounded">
                                    <p className="text-sm font-medium text-orange-800 mb-1">Exercise:</p>
                                    <p className="text-sm text-orange-700">{lesson.structure.exercise}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Course Actions */}
              <div className="flex gap-4 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setStep(10)}
                  className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Back to Avatars
                </button>
                <button
                  onClick={() => {
                    setStep(0);
                    setUserName('');
                    setUserAnswers({
                      icpDesire: '', icpDecision: '', currentProblem: '', icpDestination: '',
                      uniqueFramework: '', fourDesires: '', sixSs: '', promisedResult: ''
                    });
                    setGeneratedStatements({ solutionStatement: '', uspStatement: '' });
                    setGeneratedStatementsHistory([]);
                    setCourseOutline(null);
                    setAvatars({
                      male: { name: '', age: '', income: '', location: '', occupation: '', imageUrl: '', painPoints: {} },
                      female: { name: '', age: '', income: '', location: '', occupation: '', imageUrl: '', painPoints: {} }
                    });
                    localStorage.removeItem('gravity_user_profile');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create New Course
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600">No course outline available</p>
              <button
                onClick={() => setStep(10)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go Back to Generate Course
              </button>
            </div>
          )}

          {apiError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {apiError}
            </div>
          )}
        </div>
      );
    }

    // Regular question steps with navigation
    return (
      <div className="h-full flex flex-col">
        {/* Question Header with Navigation - Pinned to Top */}
        <div className="flex-shrink-0 pb-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-500">
              Step {step} of 8
            </div>
            <div className="flex gap-2">
              {step > 1 && (
                <button
                  onClick={() => goToStep(step - 1)}
                  className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                >
                  ← Previous
                </button>
              )}
              {step < 8 && userAnswers[Object.keys(userAnswers)[step - 1]] && (
                <button
                  onClick={() => goToStep(step + 1)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-800 leading-tight">
            {questions[step - 1]}
          </h2>
          
          {/* Progress dots */}
          <div className="flex gap-1 mt-3">
            {[1,2,3,4,5,6,7,8].map((stepNum) => (
              <button
                key={stepNum}
                onClick={() => goToStep(stepNum)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  stepNum < step ? 'bg-blue-500 hover:bg-blue-600' : 
                  stepNum === step ? 'bg-blue-300' : 
                  'bg-slate-200 hover:bg-slate-300'
                }`}
                title={`Go to step ${stepNum}`}
              />
            ))}
          </div>
        </div>

        {/* Suggestions - Scrollable Middle Section */}
        <div className="flex-1 overflow-y-auto py-6">
          {suggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h3 className="text-lg font-medium text-slate-700">
                  AI Suggestions
                </h3>
                <span className="text-xs text-slate-500">(Click to add to your answer)</span>
              </div>
              
              {isLoadingSuggestions ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-all duration-200 group"
                    >
                      <div className="font-medium text-slate-800 group-hover:text-blue-700 transition-colors">
                        {suggestion.label || suggestion.name || suggestion}
                      </div>
                      {suggestion.description && (
                        <div className="text-sm text-slate-600 mt-1 leading-relaxed">
                          {suggestion.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              {apiError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {apiError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Field - Pinned to Bottom */}
        <div className="flex-shrink-0 pt-6 border-t border-slate-200">
          <div className="relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isInputDisabled}
              placeholder="Type your answer here or click suggestions above..."
              className="w-full h-32 px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 resize-none"
            />
          </div>
          
          <button
            onClick={handleNextStep}
            disabled={!inputValue.trim() || isLoading}
            className={`w-full mt-4 px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${
              inputValue.trim() && !isLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Processing...' : 'Next Step'}
          </button>
        </div>
      </div>
    );
  };

  // Render the preview panel content
  const renderPreviewPanel = () => {
    if (step === 0) {
      return (
        <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200/50">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Course Creator Preview</h3>
          <p className="text-slate-600 leading-relaxed">
            Welcome to the Gravity Course Creator! This tool will guide you through creating your ideal customer profile and marketing statements. 
            Once you enter your name, we'll begin the 8-step process to build your course foundation.
          </p>
        </div>
      );
    }

    if (step >= 1 && step <= 8) {
      return (
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200/50">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Progress Overview</h3>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[1,2,3,4,5,6,7,8].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`h-2 rounded-full ${
                    stepNum < step ? 'bg-blue-500' : 
                    stepNum === step ? 'bg-blue-300' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-slate-600">Step {step} of 8 completed</p>
          </div>
          
          {Object.entries(userAnswers).filter(([key, value]) => value.trim() !== '').map(([key, value], index) => (
            <div key={key} className="p-4 bg-white rounded-lg border border-slate-200/50 shadow-sm">
              <h4 className="text-sm font-medium text-slate-700 mb-2 capitalize">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed">{value}</p>
            </div>
          ))}
        </div>
      );
    }

    if (step === 9) {
      return (
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200/50">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Generated Statements</h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/80 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Solution Statement</h4>
                <p className="text-slate-600 text-sm leading-relaxed">{generatedStatements.solutionStatement}</p>
              </div>
              <div className="p-4 bg-white/80 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">USP Statement</h4>
                <p className="text-slate-600 text-sm leading-relaxed">{generatedStatements.uspStatement}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Main app layout
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-semibold text-slate-800">Gravity Course Creator</h1>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  // Reset everything to start a new course
                  setStep(0);
                  setUserName('');
                  setInputValue('');
                  setUserAnswers({
                    icpDesire: '', icpDecision: '', currentProblem: '', icpDestination: '',
                    uniqueFramework: '', fourDesires: '', sixSs: '', promisedResult: ''
                  });
                  setGeneratedStatements({ solutionStatement: '', uspStatement: '' });
                  setGeneratedStatementsHistory([]);
                  setCurrentHistoryIndex(-1);
                  setAvatars({
                    male: { name: '', age: '', income: '', location: '', occupation: '', imageUrl: '', painPoints: {} },
                    female: { name: '', age: '', income: '', location: '', occupation: '', imageUrl: '', painPoints: {} }
                  });
                  setCourseOutline(null);
                  // Clear localStorage
                  localStorage.removeItem('gravity_user_profile');
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Create New Course
              </button>
              <button className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                Asset Library
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-600">
              {userName && `Welcome, ${userName}`}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Input Panel */}
        <div className="w-1/2 p-8 overflow-y-auto">
          <div className="max-w-2xl">
            {renderInputPanel()}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-1/2 p-8 bg-slate-100 border-l border-slate-200 overflow-y-auto">
          <div className="max-w-2xl">
            {renderPreviewPanel()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
