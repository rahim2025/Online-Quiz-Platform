import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuizStore } from '../store/useQuizStore'
import { authStore } from '../store/useAuthStore'

export const CreateQuizPage = () => {
  const { classId } = useParams()
  const navigate = useNavigate()
  const { createQuiz, loading, error } = useQuizStore()
  const { authUser } = authStore()

  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    duration: 30, // Default to 30 minutes
    startTime: '',
    endTime: '',
    questions: []
  })

  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: '',
    questionType: 'multiple-choice',
    options: ['', ''],
    correctAnswer: '',
    points: 1
  })

  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [editingIndex, setEditingIndex] = useState(-1)
  const [validationError, setValidationError] = useState('')

  // For date-time inputs, we need formatted strings
  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(12, 0, 0, 0)
    
    const nextDay = new Date(tomorrow)
    nextDay.setHours(13, 0, 0, 0)
    
    setQuizData(prev => ({
      ...prev,
      startTime: formatDateForInput(tomorrow),
      endTime: formatDateForInput(nextDay)
    }))
  }, [])

  // Format date for datetime-local input
  const formatDateForInput = (date) => {
    return date.toISOString().slice(0, 16)
  }

  const handleQuizChange = (e) => {
    const { name, value } = e.target
    setQuizData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleQuestionChange = (e) => {
    const { name, value } = e.target
    
    if (name === 'questionType') {
      // Reset options and correctAnswer when changing question type
      let updatedQuestion = {
        ...currentQuestion,
        questionType: value
      }
      
      if (value === 'multiple-choice') {
        updatedQuestion.options = ['', '']
        updatedQuestion.correctAnswer = ''
      } else if (value === 'true-false') {
        updatedQuestion.options = []
        updatedQuestion.correctAnswer = true
      } else {
        updatedQuestion.options = []
        updatedQuestion.correctAnswer = ''
      }
      
      setCurrentQuestion(updatedQuestion)
    } else {
      setCurrentQuestion(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...currentQuestion.options]
    updatedOptions[index] = value
    
    setCurrentQuestion(prev => ({
      ...prev,
      options: updatedOptions
    }))
  }

  const addOption = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: [...prev.options, '']
    }))
  }

  const removeOption = (index) => {
    const updatedOptions = currentQuestion.options.filter((_, i) => i !== index)
    const updatedCorrectAnswer = currentQuestion.correctAnswer === currentQuestion.options[index]
      ? ''
      : currentQuestion.correctAnswer
    
    setCurrentQuestion(prev => ({
      ...prev,
      options: updatedOptions,
      correctAnswer: updatedCorrectAnswer
    }))
  }

  const validateQuestion = () => {
    if (!currentQuestion.questionText.trim()) {
      setValidationError('Question text is required')
      return false
    }

    if (currentQuestion.questionType === 'multiple-choice') {
      if (currentQuestion.options.length < 2) {
        setValidationError('Multiple choice questions must have at least 2 options')
        return false
      }
      
      if (currentQuestion.options.some(opt => !opt.trim())) {
        setValidationError('All options must have content')
        return false
      }
      
      if (!currentQuestion.correctAnswer) {
        setValidationError('You must select a correct answer')
        return false
      }
    }

    if (currentQuestion.questionType === 'true-false' && 
        typeof currentQuestion.correctAnswer !== 'boolean') {
      setValidationError('True/False questions must have a boolean answer')
      return false
    }

    setValidationError('')
    return true
  }

  const addQuestion = () => {
    if (!validateQuestion()) return
    
    let finalQuestion = { ...currentQuestion }
    
    // Clean up the question based on type
    if (finalQuestion.questionType === 'short-answer') {
      finalQuestion.options = []
      finalQuestion.correctAnswer = '' // No predefined correct answer for short answer
    } else if (finalQuestion.questionType === 'true-false') {
      finalQuestion.options = [] // No need to store options for true/false
    }
    
    setQuizData(prev => ({
      ...prev,
      questions: [...prev.questions, finalQuestion]
    }))
    
    // Reset the form
    setCurrentQuestion({
      questionText: '',
      questionType: 'multiple-choice',
      options: ['', ''],
      correctAnswer: '',
      points: 1
    })
    
    setShowQuestionForm(false)
  }

  const editQuestion = (index) => {
    setEditingIndex(index)
    const question = quizData.questions[index]
    
    // For true-false questions, ensure correctAnswer is boolean
    let correctAnswer = question.correctAnswer
    if (question.questionType === 'true-false') {
      correctAnswer = question.correctAnswer === 'true' || question.correctAnswer === true
    }
    
    // For multiple-choice, ensure options exist
    let options = question.options || []
    if (question.questionType === 'multiple-choice' && options.length < 2) {
      options = ['', '']
    }
    
    setCurrentQuestion({
      ...question,
      correctAnswer,
      options
    })
    
    setShowQuestionForm(true)
  }

  const updateQuestion = () => {
    if (!validateQuestion()) return
    
    let finalQuestion = { ...currentQuestion }
    
    // Clean up the question based on type
    if (finalQuestion.questionType === 'short-answer') {
      finalQuestion.options = []
      finalQuestion.correctAnswer = '' // No predefined correct answer for short answer
    } else if (finalQuestion.questionType === 'true-false') {
      finalQuestion.options = [] // No need to store options for true/false
    }
    
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === editingIndex ? finalQuestion : q)
    }))
    
    // Reset the form
    setCurrentQuestion({
      questionText: '',
      questionType: 'multiple-choice',
      options: ['', ''],
      correctAnswer: '',
      points: 1
    })
    
    setShowQuestionForm(false)
    setEditingIndex(-1)
  }

  const removeQuestion = (index) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
  }

  const validateQuiz = () => {
    if (!quizData.title.trim()) {
      setValidationError('Quiz title is required')
      return false
    }
    
    if (quizData.questions.length === 0) {
      setValidationError('Quiz must have at least one question')
      return false
    }
    
    if (!quizData.startTime || !quizData.endTime) {
      setValidationError('Start time and end time are required')
      return false
    }
    
    const startDate = new Date(quizData.startTime)
    const endDate = new Date(quizData.endTime)
    
    if (startDate >= endDate) {
      setValidationError('End time must be after start time')
      return false
    }
    
    if (isNaN(quizData.duration) || quizData.duration <= 0) {
      setValidationError('Duration must be a positive number')
      return false
    }
    
    setValidationError('')
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateQuiz()) return
    
    try {
      const result = await createQuiz({
        ...quizData,
        classId
      })
      
      if (result.success) {
        navigate(`/classes/${classId}`)
      }
    } catch (err) {
      setValidationError('An unexpected error occurred')
    }
  }

  const cancelQuestionForm = () => {
    setShowQuestionForm(false)
    setEditingIndex(-1)
    setCurrentQuestion({
      questionText: '',
      questionType: 'multiple-choice',
      options: ['', ''],
      correctAnswer: '',
      points: 1
    })
  }

  // Check if user is a teacher
  if (authUser?.userType !== 'teacher') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Only teachers can create quizzes.
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create Quiz</h1>
      
      {(error || validationError) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || validationError}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quiz Details</h2>
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Quiz Title
              </label>
              <input
                type="text"
                name="title"
                id="title"
                value={quizData.title}
                onChange={handleQuizChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Enter quiz title"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                id="description"
                value={quizData.description}
                onChange={handleQuizChange}
                rows="3"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Enter quiz description"
              />
            </div>
            
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                Time Limit (minutes)
              </label>
              <input
                type="number"
                name="duration"
                id="duration"
                value={quizData.duration}
                onChange={handleQuizChange}
                min="1"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  id="startTime"
                  value={quizData.startTime}
                  onChange={handleQuizChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  name="endTime"
                  id="endTime"
                  value={quizData.endTime}
                  onChange={handleQuizChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Questions</h2>
            {!showQuestionForm && (
              <button
                type="button"
                onClick={() => setShowQuestionForm(true)}
                className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
              >
                Add Question
              </button>
            )}
          </div>
          
          {showQuestionForm && (
            <div className="bg-gray-50 border rounded-md p-4 mb-6">
              <h3 className="text-lg font-medium mb-3">
                {editingIndex >= 0 ? 'Edit Question' : 'New Question'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Question Type
                  </label>
                  <select
                    name="questionType"
                    value={currentQuestion.questionType}
                    onChange={handleQuestionChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="true-false">True/False</option>
                    <option value="short-answer">Short Answer</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Question Text
                  </label>
                  <textarea
                    name="questionText"
                    value={currentQuestion.questionText}
                    onChange={handleQuestionChange}
                    rows="2"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="Enter your question"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Points
                  </label>
                  <input
                    type="number"
                    name="points"
                    value={currentQuestion.points}
                    onChange={handleQuestionChange}
                    min="1"
                    className="mt-1 block w-40 border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                
                {currentQuestion.questionType === 'multiple-choice' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options
                    </label>
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center mb-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={currentQuestion.correctAnswer === option}
                          onChange={() => setCurrentQuestion({
                            ...currentQuestion,
                            correctAnswer: option
                          })}
                          className="mr-2"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          className="flex-1 border border-gray-300 rounded-md shadow-sm p-2"
                          placeholder={`Option ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="ml-2 text-red-600 hover:text-red-800"
                          disabled={currentQuestion.options.length <= 2}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addOption}
                      className="text-indigo-600 hover:text-indigo-800 mt-2"
                    >
                      + Add Option
                    </button>
                  </div>
                )}
                
                {currentQuestion.questionType === 'true-false' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correct Answer
                    </label>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="trueFalseAnswer"
                          checked={currentQuestion.correctAnswer === true}
                          onChange={() => setCurrentQuestion({
                            ...currentQuestion,
                            correctAnswer: true
                          })}
                          className="mr-2"
                        />
                        <span>True</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="trueFalseAnswer"
                          checked={currentQuestion.correctAnswer === false}
                          onChange={() => setCurrentQuestion({
                            ...currentQuestion,
                            correctAnswer: false
                          })}
                          className="mr-2"
                        />
                        <span>False</span>
                      </label>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    type="button"
                    onClick={cancelQuestionForm}
                    className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={editingIndex >= 0 ? updateQuestion : addQuestion}
                    className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
                  >
                    {editingIndex >= 0 ? 'Update Question' : 'Add Question'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {quizData.questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No questions added yet. Click "Add Question" to begin.
            </div>
          ) : (
            <div className="space-y-4">
              {quizData.questions.map((question, index) => (
                <div key={index} className="border rounded-md p-4">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Q{index + 1}.</span>
                      <span>{question.questionText}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => editQuestion(index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    <span className="capitalize">{question.questionType}</span> · {question.points} {question.points === 1 ? 'point' : 'points'}
                  </div>
                  
                  {question.questionType === 'multiple-choice' && question.options.length > 0 && (
                    <div className="mt-2 pl-4">
                      <ul className="list-disc space-y-1">
                        {question.options.map((option, i) => (
                          <li key={i} className={option === question.correctAnswer ? 'font-medium text-green-600' : ''}>
                            {option} {option === question.correctAnswer && '✓'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {question.questionType === 'true-false' && (
                    <div className="mt-2 pl-4">
                      <p className="font-medium text-green-600">
                        Correct answer: {question.correctAnswer ? 'True' : 'False'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(`/classes/${classId}`)}
            className="bg-gray-300 text-gray-800 py-2 px-6 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white py-2 px-6 rounded hover:bg-indigo-700 disabled:bg-indigo-400"
          >
            {loading ? 'Creating...' : 'Create Quiz'}
          </button>
        </div>
      </form>
    </div>
  )
}