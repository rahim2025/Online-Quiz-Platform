import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useQuizStore } from '../store/useQuizStore'
import { authStore } from '../store/useAuthStore'

export const QuizPage = () => {
  const { quizId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { 
    currentQuiz, 
    quizSubmission,
    submissions,
    loading, 
    error, 
    fetchQuizDetails, 
    fetchSubmission,
    fetchQuizSubmissions,
    startQuiz,
    submitAnswer,
    completeQuiz,
    gradeSubmission,
    clearQuizState
  } = useQuizStore()
  const { authUser } = authStore()
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(null)
  const [quizError, setQuizError] = useState('')
  const [viewingResults, setViewingResults] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [grades, setGrades] = useState({})
  const [gradingSuccess, setGradingSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shortAnswerQuestions, setShortAnswerQuestions] = useState([])
  const [shortAnswers, setShortAnswers] = useState([])
  const [questionsNeedingGrading, setQuestionsNeedingGrading] = useState([])
  const [timeUntilStart, setTimeUntilStart] = useState(null)

  const isTeacher = authUser?.userType === 'teacher'
  const isQuizOwner = isTeacher && currentQuiz?.createdBy && 
    (currentQuiz.createdBy === authUser?.id || currentQuiz.createdBy === authUser?._id)
  
  useEffect(() => {
    const loadQuiz = async () => {
      if (quizId) {
        try {
          // First fetch the quiz details
          const result = await fetchQuizDetails(quizId);
          
          if (result.success) {
            const quizStatus = getQuizStatus();
            
            if (!isTeacher) {
              if (quizStatus === 'upcoming') {
                return;
              }
              
              try {
                await fetchSubmission(quizId);
              } catch (error) {
                console.log("Submission not found or not available yet");
              }
            } else {
              await fetchQuizSubmissions(quizId);
            }
          }
        } catch (error) {
          console.error("Error loading quiz:", error);
        }
      }
    };
    
    loadQuiz();
    
    return () => {
      clearQuizState();
    };
  }, [quizId, fetchQuizDetails, fetchSubmission, isTeacher, fetchQuizSubmissions, clearQuizState]);
  
  useEffect(() => {
    if (location.state?.action === 'start' && quizId) {
      handleStartQuiz()
    }
  }, [location.state, quizId])
  
  useEffect(() => {
    if (!currentQuiz || !quizSubmission || quizSubmission.status !== "in-progress") {
      return
    }
    
    const submissionStartTime = new Date(quizSubmission.startedAt).getTime()
    const durationMs = currentQuiz.duration * 60 * 1000
    const quizEndForStudent = submissionStartTime + durationMs
    
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const timeRemaining = Math.max(0, quizEndForStudent - now)
      
      if (timeRemaining <= 0) {
        clearInterval(timer)
        setTimeLeft(0)
        handleCompleteQuiz()
      } else {
        setTimeLeft(timeRemaining)
      }
    }, 1000)
    
    return () => clearInterval(timer)
  }, [currentQuiz, quizSubmission])

  useEffect(() => {
    if (!currentQuiz || getQuizStatus() !== 'upcoming') {
      return
    }

    const startTime = new Date(currentQuiz.startTime).getTime()
    
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const timeUntilQuizStart = Math.max(0, startTime - now)
      
      if (timeUntilQuizStart <= 0) {
        clearInterval(timer)
        setTimeUntilStart(0)
        fetchQuizDetails(quizId)
      } else {
        setTimeUntilStart(timeUntilQuizStart)
      }
    }, 1000)
    
    return () => clearInterval(timer)
  }, [currentQuiz, quizId, fetchQuizDetails])
  
  useEffect(() => {
    if (quizSubmission && quizSubmission.answers && quizSubmission.answers.length > 0) {
      const submissionAnswers = {}
      quizSubmission.answers.forEach(answer => {
        submissionAnswers[answer.questionId] = answer.answer
      })
      setAnswers(submissionAnswers)
    }
  }, [quizSubmission])
  
  useEffect(() => {
    if (isTeacher && quizSubmission?.answers && currentQuiz?.questions) {
      const shortAnswerAnswers = quizSubmission.answers.filter(answer => 
        answer.isCorrect === null
      );
      
      const initialGrades = {};
      
      shortAnswerAnswers.forEach(answer => {
        const question = currentQuiz.questions.find(q => 
          (q._id === answer.questionId) || (q.id === answer.questionId)
        );
        
        initialGrades[answer.questionId] = {
          questionId: answer.questionId,
          points: answer.points || 0,
          feedback: answer.feedback || '',
          maxPoints: question?.points || 0
        };
      });
      
      setGrades(initialGrades);
      setGradingSuccess(false);
      
      console.log("Short answer grading setup:", { 
        shortAnswers: shortAnswerAnswers,
        initialGrades,
        gradeKeys: Object.keys(initialGrades)
      });
    }
  }, [quizSubmission, isTeacher, currentQuiz]);

  useEffect(() => {
    if (currentQuiz && quizSubmission && (quizSubmission.status !== "in-progress" || viewingResults)) {
      console.log("Debug points data:", {
        answers: quizSubmission?.answers?.map(a => ({ 
          id: a.questionId, 
          points: a.points || 0, 
          isCorrect: a.isCorrect 
        })),
        currentQuiz: currentQuiz?.questions?.map(q => ({ 
          id: q._id, 
          points: q.points || 0, 
          text: q.questionText || 'No text', 
          type: q.questionType || 'unknown-type' 
        }))
      });
      
      const shortAns = quizSubmission?.answers?.filter(answer => answer.isCorrect === null) || [];
      
      const shortQuestions = [];
      if (shortAns.length > 0) {
        shortAns.forEach(answer => {
          const question = currentQuiz.questions?.find(q => {
            return q._id === answer.questionId || 
                  q.id === answer.questionId || 
                  answer.questionId.includes(q._id) || 
                  (q._id && answer.questionId.includes(q._id.toString()));
          });
          if (question) {
            shortQuestions.push(question);
          }
        });
      }
      
      setShortAnswerQuestions(shortQuestions);
      setShortAnswers(shortAns);
      
      const needsGrading = [];
      if (isTeacher && shortAns.length > 0) {
        shortAns.forEach(answer => {
          const questionIndex = currentQuiz.questions.findIndex(q => 
            q._id === answer.questionId || 
            q.id === answer.questionId ||
            answer.questionId.includes(q._id) || 
            (q._id && answer.questionId.includes(q._id.toString()))
          );
          if (questionIndex !== -1) {
            needsGrading.push(questionIndex);
          }
        });
      }
      
      setQuestionsNeedingGrading(needsGrading);
    }
  }, [currentQuiz, quizSubmission, isTeacher, viewingResults]);
  
  const formatTimeLeft = (ms) => {
    if (!ms) return "00:00:00"
    
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    
    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0")
    ].join(":")
  }

  const formatTimeUntilStart = (ms) => {
    if (!ms) return "Available now"
    
    const totalSeconds = Math.floor(ms / 1000)
    const days = Math.floor(totalSeconds / 86400)
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }
  
  const handleStartQuiz = async () => {
    setQuizError('')
    
    try {
      const result = await startQuiz(quizId)
      if (!result.success) {
        setQuizError(result.error)
      }
    } catch (err) {
      setQuizError('Failed to start the quiz')
    }
  }
  
  const handleAnswer = async (questionId, answer) => {
    if (isSubmitting || quizSubmission?.status !== "in-progress") return
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
    
    try {
      await submitAnswer(quizSubmission._id, questionId, answer)
    } catch (err) {
      setQuizError('Failed to submit your answer')
    }
  }
  
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }
  
  const handleNextQuestion = () => {
    if (currentQuiz && currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }
  
  const handleCompleteQuiz = async () => {
    if (!quizSubmission || quizSubmission.status !== "in-progress") return
    
    setQuizError('')
    setIsSubmitting(true)
    
    try {
      const result = await completeQuiz(quizSubmission._id)
      if (result.success) {
        setViewingResults(true)
      } else {
        setQuizError(result.error || "Failed to submit the quiz")
      }
    } catch (err) {
      setQuizError('Failed to submit the quiz')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleViewSubmission = async (studentId) => {
    if (!studentId) {
      setQuizError('Invalid student ID');
      return;
    }
    
    try {
      setQuizError(''); // Clear any previous errors
      setSelectedStudentId(studentId);
      setGradingSuccess(false); // Reset grading success message
      
      // Set loading state to show user something is happening
      setIsSubmitting(true);
      
      const result = await fetchSubmission(quizId, studentId);
      
      // Check if we got a successful response with valid data
      if (!result || !result.success) {
        setQuizError('Failed to fetch student submission');
      } else if (!result.data || (!result.data.submission && !result.data.quiz)) {
        setQuizError('No submission data found for this student');
      }
    } catch (err) {
      console.error("Error viewing submission:", err);
      setQuizError('Failed to load student submission: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleBack = () => {
    if (currentQuiz?.classId) {
      navigate(`/classes/${currentQuiz.classId}`)
    } else {
      navigate('/classes')
    }
  }
  
  const handleGradeChange = (questionId, field, value) => {
    console.log(`Updating grade for questionId: ${questionId}, field: ${field}, value: ${value}`);
    
    setGrades(prev => {
      if (!prev[questionId]) {
        const question = currentQuiz.questions.find(q => 
          q._id === questionId || q.id === questionId
        );
        
        prev[questionId] = {
          questionId,
          points: 0,
          feedback: '',
          maxPoints: question?.points || 0
        };
      }
      
      return {
        ...prev,
        [questionId]: {
          ...prev[questionId],
          [field]: value
        }
      };
    });
  }
  
  const handleSubmitGrades = async () => {
    if (!quizSubmission || !quizSubmission._id) {
      setQuizError('No submission found to grade');
      return;
    }

    const gradesToSubmit = Object.values(grades)
      .filter(g => g && g.questionId)
      .map(g => ({
        questionId: g.questionId,
        points: Number(g.points) || 0,
        feedback: g.feedback || ""
      }));

    console.log("Submitting grades:", gradesToSubmit);

    if (gradesToSubmit.length === 0) {
      setQuizError('No grades to submit');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await gradeSubmission(quizSubmission._id, gradesToSubmit);
      if (result.success) {
        setGradingSuccess(true);
        await fetchSubmission(quizId, quizSubmission.student?._id || undefined);
        await fetchQuizSubmissions(quizId);
        window.scrollTo(0, 0);
      } else {
        setQuizError(result.error || 'Failed to submit grades');
      }
    } catch (err) {
      console.error("Error submitting grades:", err);
      setQuizError('Failed to submit grades');
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const getQuizStatus = () => {
    if (!currentQuiz) return "unknown";
    
    const now = new Date()
    const startTime = new Date(currentQuiz.startTime)
    const endTime = new Date(currentQuiz.endTime)

    if (!currentQuiz.isPublished) {
      return "draft"
    } else if (now < startTime) {
      return "upcoming"
    } else if (now >= startTime && now <= endTime) {
      return "active"
    } else {
      return "ended"
    }
  }
  
  const canViewDetailedResults = () => {
    if (!currentQuiz) return false;
    
    const now = new Date()
    const endTime = new Date(currentQuiz.endTime)
    return now > endTime
  }
  

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex justify-center items-center min-h-[300px]">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-3 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/classes')}
          className="mb-4 flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Classes
        </button>
        
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded mb-4">
          <h3 className="text-lg font-medium mb-2">Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!currentQuiz) {
    return (
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/classes')}
          className="mb-4 flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Classes
        </button>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-2">Quiz not found</h1>
          <p className="text-gray-600">This quiz could not be loaded. It may have been deleted or you may not have permission to view it.</p>
        </div>
      </div>
    );
  }

  const quizStatus = getQuizStatus()
  
  const canTakeQuiz = !isTeacher && 
                       quizStatus === "active" && 
                       (!quizSubmission || quizSubmission.status === "in-progress")
  
  if ((quizSubmission && quizSubmission.status !== "in-progress") || viewingResults) {
    const showCorrectAnswers = isTeacher || canViewDetailedResults();
    const quizEnded = canViewDetailedResults();
    
    const ungraded = quizSubmission?.answers?.filter(a => a.isCorrect === null) || [];
    
    const hasShortAnswerQuestions = isTeacher && ungraded.length > 0;
    
    const updatedQuestionsNeedingGrading = [];
    if (isTeacher && ungraded.length > 0) {
      ungraded.forEach(answer => {
        const questionIndex = currentQuiz.questions.findIndex(q => 
          q._id === answer.questionId || q.id === answer.questionId
        );
        if (questionIndex !== -1) {
          updatedQuestionsNeedingGrading.push(questionIndex);
        }
      });
    }
    
    console.log("Debug points data:", {
      currentQuiz: currentQuiz?.questions?.map(q => ({ 
        id: q._id || q.id || 'unknown-id', 
        points: q.points || 0, 
        text: q.questionText || 'No text', 
        type: q.questionType || 'unknown-type' 
      })),
      answers: quizSubmission?.answers?.map(a => ({ 
        id: a.questionId || 'unknown-id', 
        points: a.points || 0, 
        isCorrect: a.isCorrect !== undefined ? a.isCorrect : 'not-graded' 
      }))
    });
    
    return (
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={handleBack}
          className="mb-4 flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Class
        </button>
        
        {quizError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {quizError}
          </div>
        )}
        
        {gradingSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Grading submitted successfully!
          </div>
        )}
        
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">{currentQuiz.title} - Results</h1>
          
          {quizSubmission && (
            <div className="bg-blue-50 p-4 rounded-md mb-4">
              <h2 className="text-lg font-medium mb-2">
                {isTeacher && quizSubmission.student ? `${quizSubmission.student.fullName}'s Score:` : 'Your Score:'}
              </h2>
              {showCorrectAnswers || isTeacher ? (
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <div className="text-3xl font-bold text-blue-700">
                    {quizSubmission.totalScore} / {quizSubmission.totalPoints}
                    <span className="text-lg text-blue-600 ml-2">
                      ({Math.round((quizSubmission.totalScore / quizSubmission.totalPoints) * 100)}%)
                    </span>
                  </div>
                  <div className={`text-sm px-3 py-1 rounded-full md:ml-2 inline-block w-fit 
                    ${quizSubmission.isGraded ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {quizSubmission.isGraded ? 'Fully Graded' : 'Partially Graded'}
                  </div>
                </div>
              ) : (
                <div className="text-3xl font-bold text-blue-700">
                  Score will be available after quiz ends
                </div>
              )}
              <div className="text-sm text-gray-600 mt-2">
                Completed: {new Date(quizSubmission.completedAt).toLocaleString()}
              </div>
              
              {!showCorrectAnswers && !isTeacher && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-yellow-800 text-sm">
                    <span className="font-medium">Note:</span> Quiz results with correct answers will be available after the quiz end time ({new Date(currentQuiz.endTime).toLocaleString()}).
                  </p>
                </div>
              )}
            </div>
          )}
          
          {hasShortAnswerQuestions && isTeacher && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
              <h3 className="font-medium text-yellow-800 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Manual Grading Required
              </h3>
              <p className="text-yellow-700 mb-4">This submission contains {ungraded.length} short answer question(s) that need grading.</p>
              
              {updatedQuestionsNeedingGrading.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-yellow-800 mb-2">Questions that need grading:</p>
                  <div className="flex flex-wrap gap-2">
                    {updatedQuestionsNeedingGrading.map(idx => (
                      <a 
                        key={idx} 
                        href={`#question-${currentQuiz.questions[idx]._id || currentQuiz.questions[idx].id}`}
                        className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
                      >
                        Question {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSubmitGrades}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    "Submit All Grades"
                  )}
                </button>
                <span className="text-sm text-gray-600">Click this button when you've finished grading all questions.</span>
              </div>
            </div>
          )}
          
          <div className="space-y-6 mt-6">
            {currentQuiz.questions.map((question, idx) => {
              const submittedAnswer = quizSubmission?.answers.find(
                a => a.questionId === question._id
              );
              
              let isCorrect = submittedAnswer?.isCorrect;
              let points = submittedAnswer?.points || 0;
              const maxPoints = question.points;
              
              let answerDisplay = '';
              if (question.questionType === 'multiple-choice') {
                answerDisplay = submittedAnswer?.answer || 'Not answered';
              } else if (question.questionType === 'true-false') {
                answerDisplay = submittedAnswer?.answer === true ? 'True' : submittedAnswer?.answer === false ? 'False' : 'Not answered';
              } else {
                answerDisplay = submittedAnswer?.answer || 'Not answered';
              }
              
              const needsGrading = isTeacher && 
                      (question.questionType === 'short-answer' && submittedAnswer?.isCorrect === null);

              let scoreBadge;
              if (showCorrectAnswers || isTeacher) {
                if (isCorrect === true) {
                  scoreBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {points}/{maxPoints} - Correct
                  </span>;
                } else if (isCorrect === false) {
                  scoreBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {points}/{maxPoints} - Incorrect
                  </span>;
                } else {
                  scoreBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Needs Grading
                  </span>;
                }
              }
              
              return (
                <div 
                  key={question._id} 
                  id={`question-${question._id}`}
                  className={`border rounded-lg p-6 ${
                    isCorrect === true ? 'bg-green-50 border-green-200' : 
                    isCorrect === false ? 'bg-red-50 border-red-200' : 
                    needsGrading ? 'bg-yellow-50 border-yellow-200' :
                    'bg-gray-50 border-gray-200'
                  } ${needsGrading ? 'ring-2 ring-yellow-400' : ''}`}
                >
                  <div className="flex flex-wrap justify-between items-start mb-3">
                    <h3 className="font-medium text-lg">Question {idx + 1}</h3>
                    {scoreBadge}
                  </div>
                  
                  <p className="text-gray-800 mb-4">{question.questionText}</p>
                  
                  <div className="mt-4">
                    {question.questionType === 'multiple-choice' && (
                      <div className="space-y-2">
                        {question.options.map((option, i) => {
                          const isSelected = answerDisplay === option;
                          const isCorrectOption = showCorrectAnswers && option === question.correctAnswer;
                          
                          return (
                            <div 
                              key={i} 
                              className={`p-3 rounded ${
                                showCorrectAnswers || isTeacher
                                  ? isSelected && isCorrectOption
                                    ? 'bg-green-100 border border-green-300' 
                                    : isSelected && !isCorrectOption
                                    ? 'bg-red-100 border border-red-300'
                                    : !isSelected && isCorrectOption
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-gray-50 border border-gray-200'
                                  : isSelected
                                  ? 'bg-blue-50 border border-blue-200'
                                  : 'bg-gray-50 border border-gray-200'
                              }`}
                            >
                              <div className="flex items-center">
                                <div className={`w-4 h-4 mr-2 flex-shrink-0 rounded-full border ${
                                  isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400'
                                }`}>
                                  {isSelected && (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <div className="w-2 h-2 rounded-full bg-white"></div>
                                    </div>
                                  )}
                                </div>
                                <span className={isCorrectOption && showCorrectAnswers ? 'font-medium' : ''}>{option}</span>
                                {showCorrectAnswers && isCorrectOption && (
                                  <span className="ml-2 text-green-600 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Correct answer
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {question.questionType === 'true-false' && (
                      <div className="space-y-2">
                        {[true, false].map((option) => {
                          const optionText = option ? 'True' : 'False';
                          const isSelected = 
                            (answerDisplay === 'True' && option) || 
                            (answerDisplay === 'False' && !option);
                          const isCorrect = option === question.correctAnswer;
                          const showCorrectness = showCorrectAnswers || isTeacher;
                          
                          return (
                            <div 
                              key={option.toString()} 
                              className={`p-3 rounded ${
                                showCorrectness 
                                  ? isSelected && isCorrect
                                    ? 'bg-green-100 border border-green-300' 
                                    : isSelected && !isCorrect
                                    ? 'bg-red-100 border border-red-300'
                                    : !isSelected && isCorrect && showCorrectAnswers
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-gray-50 border border-gray-200'
                                  : isSelected
                                  ? 'bg-blue-50 border border-blue-200'
                                  : 'bg-gray-50 border border-gray-200'
                              }`}
                            >
                              <div className="flex items-center">
                                <div className={`w-4 h-4 mr-2 flex-shrink-0 rounded-full border ${
                                  isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400'
                                }`}>
                                  {isSelected && (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <div className="w-2 h-2 rounded-full bg-white"></div>
                                    </div>
                                  )}
                                </div>
                                <span>{optionText}</span>
                                {showCorrectness && isCorrect && (
                                  <span className="ml-2 text-green-600 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Correct answer
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {question.questionType === 'short-answer' && (
                      <div className="space-y-2">
                        <div className="p-3 rounded bg-white border border-gray-200">
                          <p className="text-sm text-gray-600 mb-1">Student's Answer:</p>
                          <p className="whitespace-pre-wrap">{answerDisplay ?? <span className="italic text-gray-500">Not answered</span>}</p>
                        </div>

                        {showCorrectAnswers && question.correctAnswer && (
                          <div className="p-3 rounded bg-green-50 border border-green-200">
                            <p className="text-sm text-gray-600 mb-1">Reference Answer:</p>
                            <p className="whitespace-pre-wrap font-medium text-green-800">{question.correctAnswer}</p>
                          </div>
                        )}

                        {needsGrading && (
                          <div className="mt-4 space-y-3 p-4 bg-yellow-50 border border-yellow-200 rounded">
                            <h4 className="font-medium text-yellow-800 flex items-center">
                              <span className="inline-block w-2.5 h-2.5 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
                              <strong>Grade this answer:</strong>
                            </h4>

                            {question.correctAnswer && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                  <p className="text-sm font-medium text-gray-700 mb-1">Reference Answer:</p>
                                  <p className="text-blue-700">{question.correctAnswer}</p>
                                </div>
                            )}

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Points (max: {maxPoints})
                              </label>
                              <div className="flex items-center">
                                <input
                                  type="number"
                                  min="0"
                                  max={maxPoints}
                                  value={submittedAnswer ? (grades[submittedAnswer.questionId]?.points ?? 0) : 0}
                                  onChange={(e) => {
                                    if (submittedAnswer) {
                                      handleGradeChange(
                                        submittedAnswer.questionId,
                                        'points',
                                        Math.min(Math.max(0, parseInt(e.target.value) || 0), maxPoints)
                                      );
                                    }
                                  }}
                                  className="border border-gray-300 rounded p-2 w-20 focus:border-indigo-500 focus:ring-indigo-500"
                                  disabled={isSubmitting}
                                />
                                <div className="ml-3 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                  <div
                                    className="bg-blue-600 h-2.5 rounded-full"
                                    style={{width: submittedAnswer ? `${((grades[submittedAnswer.questionId]?.points ?? 0) / maxPoints) * 100}%` : '0%'}}
                                  ></div>
                                </div>
                              </div>

                              <div className="text-xs text-gray-600 mt-2">
                                <p>Grading guidance:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                  <li>Full points ({maxPoints}): Answer is complete and correct, matching reference if provided.</li>
                                  <li>Partial points: Answer contains some correct elements but may be incomplete or partially incorrect.</li>
                                  <li>Zero points: Answer is incorrect, irrelevant, or missing.</li>
                                </ul>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Feedback (optional)
                              </label>
                              <textarea
                                value={submittedAnswer ? (grades[submittedAnswer.questionId]?.feedback ?? '') : ''}
                                onChange={(e) => {
                                  if (submittedAnswer) {
                                    handleGradeChange(
                                      submittedAnswer.questionId,
                                      'feedback',
                                      e.target.value
                                    );
                                  }
                                }}
                                className="w-full border border-gray-300 rounded p-2 focus:border-indigo-500 focus:ring-indigo-500"
                                rows="3"
                                placeholder="Provide feedback to the student..."
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="mt-3">
                              <button
                                onClick={async () => {
                                  if (!submittedAnswer) return;

                                  const gradeForThisQuestion = {
                                    questionId: submittedAnswer.questionId,
                                    points: Number(grades[submittedAnswer.questionId]?.points ?? 0),
                                    feedback: grades[submittedAnswer.questionId]?.feedback ?? ""
                                  };

                                  setIsSubmitting(true);
                                  try {
                                    const result = await gradeSubmission(quizSubmission._id, [gradeForThisQuestion]);
                                    if (result.success) {
                                      await fetchSubmission(quizId, quizSubmission.student?._id || selectedStudentId);
                                      console.log(`Question ${idx + 1} graded successfully!`);
                                    } else {
                                       setQuizError(result.error || `Failed to grade question ${idx + 1}`);
                                    }
                                  } catch (err) {
                                    console.error("Error grading individual question:", err);
                                    setQuizError(`Error grading question ${idx + 1}`);
                                  } finally {
                                    setIsSubmitting(false);
                                  }
                                }}
                                disabled={isSubmitting || !submittedAnswer}
                                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center text-sm"
                              >
                                {isSubmitting ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Save Grade for This Question
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {submittedAnswer?.feedback && !needsGrading && (
                          <div className="p-3 rounded bg-blue-50 border border-blue-200 mt-3">
                            <p className="text-sm text-gray-600 mb-1">Teacher's Feedback:</p>
                            <p className="whitespace-pre-wrap">{submittedAnswer.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        {hasShortAnswerQuestions && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 flex justify-center">
            <div className="max-w-4xl w-full flex justify-between items-center">
              <div className="text-sm">
                <span className="font-medium">{ungraded.length}</span> short answer question(s) to grade
              </div>
              
              <button
                onClick={handleSubmitGrades}
                disabled={isSubmitting}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg key="spinner-bottom" className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span key="submitting-text-bottom">Submitting...</span>
                  </>
                ) : (
                  <span key="submit-text-bottom">Submit All Grades</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }
  
  if (isTeacher) {
    return (
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={handleBack}
          className="mb-4 flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Class
        </button>
        
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">{currentQuiz.title}</h1>
          <p className="text-gray-600">{currentQuiz.description}</p>
          
          <div className="flex flex-wrap items-center mt-4 text-sm text-gray-600">
            <div className="mr-6 mb-2">
              <span className="font-medium">Duration:</span> {currentQuiz.duration} minutes
            </div>
            <div className="mr-6 mb-2">
              <span className="font-medium">Questions:</span> {currentQuiz.questions.length}
            </div>
            <div className="mr-6 mb-2">
              <span className="font-medium">Status:</span> {quizStatus.charAt(0).toUpperCase() + quizStatus.slice(1)}
            </div>
            <div className="mr-6 mb-2">
              <span className="font-medium">Available:</span> {new Date(currentQuiz.startTime).toLocaleString()} - {new Date(currentQuiz.endTime).toLocaleString()}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Submissions</h2>
              
              {submissions.length === 0 ? (
                <p className="text-gray-500">No submissions yet.</p>
              ) : (
                <ul className="space-y-2">
                  {submissions.map((submission) => {
                    const isComplete = submission.status !== 'in-progress'
                    const isGraded = submission.isGraded
                    
                    return (
                      <li key={submission._id}>
                        <button 
                          onClick={() => handleViewSubmission(submission.student._id)}
                          className={`w-full text-left px-3 py-2 rounded ${
                            selectedStudentId === submission.student._id 
                              ? 'bg-indigo-100 text-indigo-800' 
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <div className="font-medium">{submission.student.fullName}</div>
                          <div className="text-sm text-gray-500 flex justify-between">
                            <span>
                              {isComplete 
                                ? `${submission.totalScore}/${submission.totalPoints}` 
                                : 'In progress'}
                            </span>
                            <span>
                              {isGraded 
                                ? '✓ Graded' 
                                : isComplete 
                                ? 'Needs grading'
                                : ''}
                            </span>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
          
          <div className="md:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Quiz Content</h2>
              
              <div className="space-y-4">
                {currentQuiz.questions.map((question, index) => (
                  <div key={question._id} className="border rounded-md p-4">
                    <div className="flex justify-between">
                      <h3 className="font-medium">Question {index + 1}</h3>
                      <span className="text-sm text-gray-500">{question.points} points</span>
                    </div>
                    <p className="mt-1">{question.questionText}</p>
                    
                    {question.questionType === 'multiple-choice' && question.options && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">Options:</p>
                        <ul className="list-disc pl-5">
                          {question.options.map((option, i) => (
                            <li key={i} className={option === question.correctAnswer ? 'font-medium text-green-600' : ''}>
                              {option} {option === question.correctAnswer && '✓'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {question.questionType === 'true-false' && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">Correct answer:</p>
                        <p className="font-medium text-green-600">{question.correctAnswer ? 'True' : 'False'}</p>
                      </div>
                    )}
                    
                    {question.questionType === 'short-answer' && (
                      <p className="mt-2 italic text-gray-600">Short answer question (manual grading required)</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  if (canTakeQuiz) {
    const currentQuestion = currentQuiz.questions[currentQuestionIndex]
    const currentAnswer = answers[currentQuestion._id]
    
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{currentQuiz.title}</h1>
            <div className="text-xl font-mono text-indigo-700">
              {formatTimeLeft(timeLeft)}
            </div>
          </div>
          
          {quizError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {quizError}
            </div>
          )}
          
          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
            </div>
            <div className="text-sm">
              {currentQuestion.points} point{currentQuestion.points !== 1 && 's'}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-lg">{currentQuestion.questionText}</p>
          </div>
          
          <div className="space-y-4">
            {currentQuestion.questionType === 'multiple-choice' && (
              <div className="space-y-2">
                {currentQuestion.options.map((option, i) => (
                  <div 
                    key={i}
                    onClick={() => handleAnswer(currentQuestion._id, option)}
                    className={`p-3 rounded-lg border cursor-pointer hover:bg-indigo-50 ${
                      currentAnswer === option ? 'bg-indigo-100 border-indigo-300' : 'border-gray-300'
                    }`}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
            
            {currentQuestion.questionType === 'true-false' && (
              <div className="space-y-2">
                <div 
                  onClick={() => handleAnswer(currentQuestion._id, true)}
                  className={`p-3 rounded-lg border cursor-pointer hover:bg-indigo-50 ${
                    currentAnswer === true ? 'bg-indigo-100 border-indigo-300' : 'border-gray-300'
                  }`}
                >
                  True
                </div>
                <div 
                  onClick={() => handleAnswer(currentQuestion._id, false)}
                  className={`p-3 rounded-lg border cursor-pointer hover:bg-indigo-50 ${
                    currentAnswer === false ? 'bg-indigo-100 border-indigo-300' : 'border-gray-300'
                  }`}
                >
                  False
                </div>
              </div>
            )}
            
            {currentQuestion.questionType === 'short-answer' && (
              <div>
                <textarea
                  value={currentAnswer || ''}
                  onChange={(e) => handleAnswer(currentQuestion._id, e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-md p-2 min-h-[100px]"
                  placeholder="Type your answer here..."
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0 || isSubmitting}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <button
              type="button"
              onClick={currentQuestionIndex === currentQuiz.questions.length - 1 ? handleCompleteQuiz : handleNextQuestion}
              disabled={isSubmitting}
              className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestionIndex === currentQuiz.questions.length - 1 ? 'Finish Quiz' : 'Next'}
            </button>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <h2 className="font-medium mb-3">Question Navigation</h2>
          <div className="flex flex-wrap gap-2">
            {currentQuiz.questions.map((question, i) => {
              const hasAnswer = answers[question._id] !== undefined
              
              return (
                <button
                  key={question._id}
                  onClick={() => setCurrentQuestionIndex(i)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full ${
                    i === currentQuestionIndex
                      ? 'bg-indigo-600 text-white'
                      : hasAnswer
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-gray-100 text-gray-800 border border-gray-300'
                  }`}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
          
          <div className="mt-4">
            <button
              onClick={handleCompleteQuiz}
              disabled={isSubmitting}
              className="w-full px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Submit your quiz when you're done. You can review and change your answers until then.
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={handleBack}
        className="mb-4 flex items-center text-indigo-600 hover:text-indigo-800"
      >
        <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Class
      </button>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">{currentQuiz.title}</h1>
        <p className="text-gray-600 mb-6">{currentQuiz.description}</p>
        
        <div className="flex flex-wrap gap-y-2">
          <div className="w-1/2 md:w-1/4">
            <span className="text-gray-600">Duration:</span>
            <p className="font-medium">{currentQuiz.duration} minutes</p>
          </div>
          <div className="w-1/2 md:w-1/4">
            <span className="text-gray-600">Total Questions:</span>
            <p className="font-medium">{currentQuiz.questions?.length || 0}</p>
          </div>
          <div className="w-1/2 md:w-1/4">
            <span className="text-gray-600">Available From:</span>
            <p className="font-medium">{new Date(currentQuiz.startTime).toLocaleDateString()}</p>
            <p className="text-sm">{new Date(currentQuiz.startTime).toLocaleTimeString()}</p>
          </div>
          <div className="w-1/2 md:w-1/4">
            <span className="text-gray-600">Available Until:</span>
            <p className="font-medium">{new Date(currentQuiz.endTime).toLocaleDateString()}</p>
            <p className="text-sm">{new Date(currentQuiz.endTime).toLocaleTimeString()}</p>
          </div>
        </div>
        
        {quizStatus === 'upcoming' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h2 className="text-lg font-semibold text-blue-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0116 0z" />
              </svg>
              Quiz Available Soon
            </h2>
            <p className="text-blue-700 mb-2">
              This quiz will be available starting from {new Date(currentQuiz.startTime).toLocaleString()}.
            </p>
            <div className="bg-white rounded-lg border border-blue-100 p-3 mt-3">
              <p className="text-sm text-gray-500">Time until quiz starts:</p>
              <div className="flex items-center">
                <div className="text-2xl font-mono text-blue-700 mr-2">
                  {formatTimeUntilStart(timeUntilStart)}
                </div>
                <div className="text-sm text-blue-600">
                  {timeUntilStart === 0 ? 
                    <span className="animate-pulse">Refreshing...</span> : 
                    <button 
                      onClick={() => window.location.reload()} 
                      className="underline hover:text-blue-800"
                    >
                      Refresh page
                    </button>
                  }
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white rounded border border-blue-100">
              <h3 className="text-md font-medium mb-2">Quiz Preview</h3>
              <p className="text-gray-600 mb-3">{currentQuiz.description}</p>
              <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                <div className="bg-blue-50 px-2 py-1 rounded">
                  {currentQuiz.questions?.length || 0} questions
                </div>
                <div className="bg-blue-50 px-2 py-1 rounded">
                  {currentQuiz.duration} minutes
                </div>
                <div className="bg-blue-50 px-2 py-1 rounded">
                  {Math.round(currentQuiz.questions?.reduce((sum, q) => sum + q.points, 0))} total points
                </div>
              </div>
            </div>
          </div>
        )}
        
        {quizStatus === 'active' && quizSubmission && quizSubmission.status !== "in-progress" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
            <h2 className="text-lg font-semibold text-green-800">You have completed this quiz</h2>
            <p className="text-green-700">
              You submitted this quiz on {new Date(quizSubmission.completedAt).toLocaleString()}.
            </p>
            <button 
              onClick={() => setViewingResults(true)}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              View Results
            </button>
          </div>
        )}
        
        {quizStatus === 'ended' && !quizSubmission && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
            <h2 className="text-lg font-semibold text-red-800">This quiz has ended</h2>
            <p className="text-red-700">
              The quiz was available until {new Date(currentQuiz.endTime).toLocaleString()}.
            </p>
          </div>
        )}
        
        {quizStatus === 'active' && !quizSubmission && (
          <div className="mt-6">
            <button 
              onClick={handleStartQuiz}
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-70"
            >
              {loading ? 'Loading...' : 'Start Quiz'}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              You will have {currentQuiz.duration} minutes to complete this quiz once you start.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}