import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

// Helper function to determine quiz status - defined outside the store
const determineQuizStatus = (quiz) => {
  if (!quiz) return "unknown";
  
  const now = new Date();
  const startTime = new Date(quiz.startTime);
  const endTime = new Date(quiz.endTime);

  if (!quiz.isPublished) {
    return "draft";
  } else if (now < startTime) {
    return "upcoming";
  } else if (now >= startTime && now <= endTime) {
    return "active";
  } else {
    return "ended";
  }
};

export const useQuizStore = create((set, get) => ({
  quizzes: [],
  currentQuiz: null,
  quizSubmission: null,
  submissions: [],
  classMarks: null,
  loading: false,
  error: null,
  
  // Added missing state variables for HomePage
  activeQuizzes: [],
  upcomingQuizzes: [],
  recentSubmissions: [],

  // For teachers to create a quiz
  createQuiz: async (quizData) => {
    try {
      set({ loading: true, error: null });
      const response = await axiosInstance.post("/quizzes/create", quizData);
      set((state) => ({
        quizzes: [...state.quizzes, response.data]
      }));
      set({ loading: false });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error creating quiz:", error);
      const errorMessage = error.response?.data?.message || "Failed to create quiz";
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Get quizzes for a class
  fetchClassQuizzes: async (classId) => {
    try {
      set({ loading: true, error: null });
      const response = await axiosInstance.get(`/quizzes/class/${classId}`);
      set({ quizzes: response.data, loading: false });
      return { success: true };
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      const errorMessage = error.response?.data?.message || "Failed to fetch quizzes";
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Get a specific quiz
  fetchQuizDetails: async (quizId) => {
    try {
      set({ loading: true, error: null });
      const response = await axiosInstance.get(`/quizzes/${quizId}`);
      set({ currentQuiz: response.data, loading: false });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching quiz details:", error);
      const errorMessage = error.response?.data?.message || "Failed to fetch quiz details";
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Update a quiz
  updateQuiz: async (quizId, updateData) => {
    try {
      set({ loading: true, error: null });
      const response = await axiosInstance.put(`/quizzes/${quizId}`, updateData);
      
      // Update quizzes list and current quiz
      set((state) => ({
        quizzes: state.quizzes.map(quiz => 
          quiz._id === quizId ? response.data : quiz
        ),
        currentQuiz: state.currentQuiz?._id === quizId ? response.data : state.currentQuiz
      }));
      
      set({ loading: false });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error updating quiz:", error);
      const errorMessage = error.response?.data?.message || "Failed to update quiz";
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Publish a quiz
  publishQuiz: async (quizId) => {
    try {
      set({ loading: true, error: null });
      const response = await axiosInstance.post(`/quizzes/${quizId}/publish`);
      
      // Update quizzes list and current quiz
      set((state) => ({
        quizzes: state.quizzes.map(quiz => 
          quiz._id === quizId ? response.data.quiz : quiz
        ),
        currentQuiz: state.currentQuiz?._id === quizId ? response.data.quiz : state.currentQuiz
      }));
      
      set({ loading: false });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error publishing quiz:", error);
      const errorMessage = error.response?.data?.message || "Failed to publish quiz";
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // For students to start a quiz
  startQuiz: async (quizId) => {
    try {
      set({ loading: true, error: null });
      const response = await axiosInstance.post(`/quizzes/${quizId}/start`);
      set({ 
        currentQuiz: response.data.quiz, 
        quizSubmission: response.data.submission,
        loading: false 
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error starting quiz:", error);
      const errorMessage = error.response?.data?.message || "Failed to start quiz";
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // For students to submit an answer
  submitAnswer: async (submissionId, questionId, answer) => {
    try {
      set({ loading: true, error: null }); // Consider removing loading state here for better UX
      const response = await axiosInstance.post(`/quizzes/submission/${submissionId}/answer`, {
        questionId,
        answer
      });
      
      // Update the submission with the new answer
      set((state) => {
        if (!state.quizSubmission || state.quizSubmission._id !== submissionId) {
          return state;
        }
        
        const updatedAnswers = [...state.quizSubmission.answers];
        const existingAnswerIndex = updatedAnswers.findIndex(
          a => a.questionId === questionId
        );
        
        if (existingAnswerIndex >= 0) {
          updatedAnswers[existingAnswerIndex] = response.data.answer;
        } else {
          updatedAnswers.push(response.data.answer);
        }
        
        return {
          ...state,
          quizSubmission: {
            ...state.quizSubmission,
            answers: updatedAnswers
          },
          // loading: false // Remove loading state change here if set above
        };
      });
       set({ loading: false }); // Set loading false after state update

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error submitting answer:", error);
      const errorMessage = error.response?.data?.message || "Failed to submit answer";
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // For students to complete a quiz
  completeQuiz: async (submissionId) => {
    try {
      set({ loading: true, error: null });
      const response = await axiosInstance.post(`/quizzes/submission/${submissionId}/complete`);
      
      console.log("Raw response data in completeQuiz:", response.data);

      // Simplify state update - directly use backend data if structure is correct
      set({
        currentQuiz: response.data.quiz || get().currentQuiz, // Use backend quiz data directly or fallback
        quizSubmission: response.data.submission || null, // Use backend submission data directly
        loading: false
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error completing quiz:", error);
      const errorMessage = error.response?.data?.message || "Failed to complete quiz";
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // For teachers to grade a submission
  gradeSubmission: async (submissionId, grades) => {
    try {
      set({ loading: true, error: null });
      const response = await axiosInstance.post(`/quizzes/submission/${submissionId}/grade`, {
        grades
      });
      
      // Update the submissions list if it exists
      set((state) => ({
        submissions: state.submissions.map(sub => 
          sub._id === submissionId ? response.data.submission : sub
        ),
        // Also update the currently viewed submission if it matches
        quizSubmission: state.quizSubmission?._id === submissionId ? response.data.submission : state.quizSubmission,
        loading: false
      }));
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error grading submission:", error);
      const errorMessage = error.response?.data?.message || "Failed to grade submission";
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // For teachers to view all submissions for a quiz
  fetchQuizSubmissions: async (quizId) => {
    try {
      set({ loading: true, error: null });
      const response = await axiosInstance.get(`/quizzes/${quizId}/submissions`);
      set({ submissions: response.data, loading: false });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching submissions:", error);
      const errorMessage = error.response?.data?.message || "Failed to fetch submissions";
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // For students to view their submission or teachers to view a specific submission
  fetchSubmission: async (quizId, studentId = null) => {
    try {
      set({ loading: true, error: null });
      let url = `/quizzes/${quizId}/submission`;
      if (studentId) {
        url += `?studentId=${studentId}`;
      }

      const response = await axiosInstance.get(url);
      console.log("Raw response data in fetchSubmission:", response.data); // Log 1

      // Process the data based on what we received
      // Handle the case where submission is null (for upcoming quizzes)
      const backendQuiz = response.data.quiz;
      const backendSubmission = response.data.submission;
      const quizStatus = response.data.quizStatus || 
                        (backendQuiz ? determineQuizStatus(backendQuiz) : null); // Use our helper function
      const quizToProcess = backendQuiz || get().currentQuiz;

      let processedQuiz = null;
      if (quizToProcess && quizToProcess.questions) {
        // Ensure quizToProcess itself is a plain object if it came from backend
        const plainQuizBase = typeof quizToProcess.toObject === 'function' ? quizToProcess.toObject() : quizToProcess;

        processedQuiz = {
          ...plainQuizBase, // Use the plain base object
          questions: plainQuizBase.questions.map(q => {
            // Convert Mongoose doc/subdoc to plain object
            const plainQuestion = typeof q.toObject === 'function' ? q.toObject() : (q._doc || q);

            // Ensure essential properties exist and have correct types
            plainQuestion._id = String(plainQuestion._id || plainQuestion.id || ''); // Ensure string ID
            plainQuestion.id = plainQuestion._id; // Keep id consistent
            plainQuestion.points = Number(plainQuestion.points) || 0;
            plainQuestion.questionText = String(plainQuestion.questionText || '');
            plainQuestion.questionType = String(plainQuestion.questionType || 'unknown');
            plainQuestion.options = Array.isArray(plainQuestion.options) ? plainQuestion.options : [];

            // Remove potential Mongoose internals if they weren't stripped by toObject/_doc
            delete plainQuestion.$__;
            delete plainQuestion.__v;
            delete plainQuestion._doc; // Clean up if _doc was used

            return plainQuestion;
          })
        };
      } else if (quizToProcess) {
         // Ensure base is plain object even if no questions
         const plainQuizBase = typeof quizToProcess.toObject === 'function' ? quizToProcess.toObject() : quizToProcess;
         processedQuiz = { ...plainQuizBase, questions: [] };
      }

      console.log("Processed quiz data before setting state:", processedQuiz); // Log 2

      // --- Deep Clone before setting state --- 
      const finalQuizState = processedQuiz ? JSON.parse(JSON.stringify(processedQuiz)) : null;
      const finalSubmissionState = backendSubmission ? JSON.parse(JSON.stringify(backendSubmission)) : null;
      // --- End Deep Clone ---

      // Prepare the state update object with additional status information if available
      const stateUpdate = {
        quizSubmission: finalSubmissionState,
        currentQuiz: finalQuizState,
        loading: false,
        quizStatus: quizStatus // Store quiz status in state using our helper function
      };

      // --- Debugging Log 3 --- 
      console.log("Data being passed to set() for state update (deep cloned):", stateUpdate);
      // --- End Debugging Log 3 ---

      set(stateUpdate); // Update the state

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching submission:", error);
      const errorMessage = error.response?.data?.message || "Failed to fetch submission";
      set({ loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  // Fetch all quiz marks for a student in a class
  fetchStudentClassMarks: async (classId, studentId = null) => {
    try {
      set({ loading: true, error: null });
      
      let url = `/quizzes/class/${classId}/marks`;
      if (studentId) {
        url += `?studentId=${studentId}`;
      }
      
      const response = await axiosInstance.get(url);
      set({ classMarks: response.data, loading: false });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching class marks:", error);
      const errorMessage = error.response?.data?.message || "Failed to fetch quiz marks";
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  // Clear quiz state when navigating away
  clearQuizState: () => {
    set({
      currentQuiz: null,
      quizSubmission: null,
      submissions: [], // Also clear submissions list? Maybe not needed.
      error: null,
      loading: false
    });
  },
  
  // Clear class marks state
  clearClassMarks: () => {
    set({
      classMarks: null
    });
  },
  
  // Fetch active quizzes for the student dashboard
  fetchActiveQuizzes: async () => {
    try {
      set({ loading: true, error: null });
      const response = await axiosInstance.get('/quizzes/active');
      set({ activeQuizzes: response.data, loading: false });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching active quizzes:", error);
      const errorMessage = error.response?.data?.message || "Failed to fetch active quizzes";
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  // Fetch upcoming quizzes for the student dashboard
  fetchUpcomingQuizzes: async () => {
    try {
      set({ loading: true, error: null });
      const response = await axiosInstance.get('/quizzes/upcoming');
      set({ upcomingQuizzes: response.data, loading: false });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching upcoming quizzes:", error);
      const errorMessage = error.response?.data?.message || "Failed to fetch upcoming quizzes";
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  // Fetch recent quiz submissions for the student dashboard
  fetchRecentSubmissions: async () => {
    try {
      set({ loading: true, error: null });
      const response = await axiosInstance.get('/quizzes/submissions/recent');
      set({ recentSubmissions: response.data, loading: false });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching recent submissions:", error);
      const errorMessage = error.response?.data?.message || "Failed to fetch recent submissions";
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
  
  // Utility function to get quiz status - exposed for components to use
  getQuizStatus: (quiz) => {
    return determineQuizStatus(quiz);
  }
}));