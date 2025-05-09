import Quiz from "../models/quiz.model.js";
import Class from "../models/class.model.js";
import Submission from "../models/submission.model.js";
import { createNotification } from "./notification.controller.js";

export const createQuiz = async (req, res) => {
  try {
    const { classId, title, description, questions, duration, startTime, endTime } = req.body;
    const teacher = req.user;

    if (teacher.userType !== "teacher") {
      return res.status(403).json({
        message: "Only teachers can create quizzes"
      });
    }

    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (classObj.teacher.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: "You don't have permission to create quizzes for this class" });
    }

    for (const question of questions) {
      if (question.questionType === "multiple-choice" && (!question.options || question.options.length < 2)) {
        return res.status(400).json({ message: "Multiple choice questions must have at least 2 options" });
      }


      if (question.questionType === "true-false") {
        if (typeof question.correctAnswer === "string") {
          question.correctAnswer = question.correctAnswer === "true";
        }
        
        if (typeof question.correctAnswer !== "boolean") {
          return res.status(400).json({ message: "True/False questions must have a boolean answer" });
        }
      }

      if (question.questionType === "multiple-choice" && !question.options.includes(question.correctAnswer)) {
        return res.status(400).json({ message: "Correct answer must be one of the options" });
      }
    }

    const quiz = new Quiz({
      classId,
      title,
      description,
      questions,
      duration, 
      startTime,
      endTime,
      createdBy: teacher._id,
      isPublished: false 
    });

    await quiz.save();

    res.status(201).json(quiz);
  } catch (error) {
    console.error("Error creating quiz:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getClassQuizzes = async (req, res) => {
  try {
    const { classId } = req.params;
    const user = req.user;

  
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({ message: "Class not found" });
    }


    const isTeacher = classObj.teacher.toString() === user._id.toString();
    const isStudent = classObj.students.some(id => id.toString() === user._id.toString());

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ message: "You don't have permission to access this class" });
    }

    const quizzes = await Quiz.find({ classId });

    if (!isTeacher) {
      const publishedQuizzes = quizzes
        .filter(quiz => quiz.isPublished)
        .map(quiz => {
          const { questions, ...quizData } = quiz.toObject();
          return {
            ...quizData,
            questions: questions.map(({ correctAnswer, ...questionData }) => questionData)
          };
        });
      
      return res.status(200).json(publishedQuizzes);
    }

    res.status(200).json(quizzes);
  } catch (error) {
    console.error("Error fetching class quizzes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getQuizDetails = async (req, res) => {
  try {
    const { quizId } = req.params;
    const user = req.user;

    const quiz = await Quiz.findById(quizId).populate("classId");
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const classObj = quiz.classId;
    const isTeacher = classObj.teacher.toString() === user._id.toString();
    const isStudent = classObj.students.some(id => id.toString() === user._id.toString());

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ message: "You don't have permission to access this quiz" });
    }

    if (!isTeacher) {
      if (!quiz.isPublished) {
        return res.status(403).json({ message: "This quiz is not yet available" });
      }

      const { questions, ...quizData } = quiz.toObject();
      return res.status(200).json({
        ...quizData,
        questions: questions.map(({ correctAnswer, ...questionData }) => questionData)
      });
    }

    res.status(200).json(quiz);
  } catch (error) {
    console.error("Error fetching quiz details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update a quiz (teacher only)
export const updateQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const updateData = req.body;
    const teacher = req.user;


    if (teacher.userType !== "teacher") {
      return res.status(403).json({ message: "Only teachers can update quizzes" });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (quiz.createdBy.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: "You don't have permission to update this quiz" });
    }

    if (quiz.isPublished && updateData.questions) {
      return res.status(400).json({ message: "Cannot modify questions of a published quiz" });
    }

    Object.assign(quiz, updateData);
    await quiz.save();

    res.status(200).json(quiz);
  } catch (error) {
    console.error("Error updating quiz:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const publishQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const teacher = req.user;

    if (teacher.userType !== "teacher") {
      return res.status(403).json({ message: "Only teachers can publish quizzes" });
    }

    const quiz = await Quiz.findById(quizId).populate("classId");
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }


    if (quiz.createdBy.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: "You don't have permission to publish this quiz" });
    }


    if (!quiz.questions || quiz.questions.length === 0) {
      return res.status(400).json({ message: "Cannot publish a quiz with no questions" });
    }

    const classObj = await Class.findById(quiz.classId).populate("students", "fullName");
    if (!classObj) {
      return res.status(404).json({ message: "Class not found" });
    }

    quiz.isPublished = true;
    await quiz.save();

    const startDate = new Date(quiz.startTime).toLocaleDateString();
    const formattedStartTime = new Date(quiz.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const notificationTitle = `New Quiz Available: ${quiz.title}`;
    const notificationMessage = `A new quiz "${quiz.title}" has been published in class "${classObj.name}". Available from ${startDate} at ${formattedStartTime}.`;


    if (classObj.students && classObj.students.length > 0) {
      const notificationPromises = classObj.students.map(student => 
        createNotification(
          student._id,
          "quiz-published",
          notificationTitle,
          notificationMessage,
          quiz._id,
          "Quiz"
        )
      );
      
      await Promise.all(notificationPromises);
    }

    res.status(200).json({ message: "Quiz published successfully", quiz });
  } catch (error) {
    console.error("Error publishing quiz:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const startQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const student = req.user;

    if (student.userType !== "student") {
      return res.status(403).json({ message: "Only students can take quizzes" });
    }

    const quiz = await Quiz.findById(quizId).populate("classId");
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

  
    if (!quiz.isPublished) {
      return res.status(403).json({ message: "This quiz is not available" });
    }

  
    const isEnrolled = quiz.classId.students.some(id => id.toString() === student._id.toString());
    if (!isEnrolled) {
      return res.status(403).json({ message: "You are not enrolled in this class" });
    }

    const now = new Date();
    if (now < new Date(quiz.startTime) || now > new Date(quiz.endTime)) {
      return res.status(403).json({ message: "The quiz is not currently active" });
    }

    const existingSubmission = await Submission.findOne({
      quiz: quizId,
      student: student._id
    });

    if (existingSubmission) {

      if (existingSubmission.status !== "in-progress") {
        return res.status(400).json({ message: "You have already completed this quiz" });
      }
      
      const { questions, ...quizData } = quiz.toObject();
      return res.status(200).json({
        message: "Continuing previous quiz session",
        quiz: {
          ...quizData,
          questions: questions.map(({ correctAnswer, ...questionData }) => questionData)
        },
        submission: existingSubmission
      });
    }

    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    
    const submission = new Submission({
      quiz: quizId,
      student: student._id,
      startedAt: now,
      totalPoints: totalPoints,
      answers: []
    });

    await submission.save();


    const { questions, ...quizData } = quiz.toObject();
    
    res.status(200).json({
      message: "Quiz started successfully",
      quiz: {
        ...quizData,
        questions: questions.map(({ correctAnswer, ...questionData }) => questionData)
      },
      submission
    });
  } catch (error) {
    console.error("Error starting quiz:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { questionId, answer } = req.body;
    const student = req.user;


    if (student.userType !== "student") {
      return res.status(403).json({ message: "Only students can submit answers" });
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    
    if (submission.student.toString() !== student._id.toString()) {
      return res.status(403).json({ message: "This is not your submission" });
    }


    if (submission.status !== "in-progress") {
      return res.status(400).json({ message: "This quiz has already been completed" });
    }

    const quiz = await Quiz.findById(submission.quiz);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }


    const now = new Date();
    if (now > new Date(quiz.endTime)) {
      return res.status(403).json({ message: "The quiz time is over" });
    }


    const question = quiz.questions.id(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    
    const existingAnswerIndex = submission.answers.findIndex(
      a => a.questionId.toString() === questionId
    );

    let isCorrect = null;
    let points = 0;

    
    if (question.questionType !== "short-answer") {
  
      let normalizedAnswer = answer;
      if (question.questionType === "true-false" && typeof answer === "string") {
        normalizedAnswer = answer === "true";
      }
      
      isCorrect = question.questionType === "true-false" 
        ? question.correctAnswer === normalizedAnswer 
        : question.correctAnswer === answer;
      
      points = isCorrect ? question.points : 0;
    }

    const newAnswer = {
      questionId,
      answer,
      isCorrect,
      points
    };

    if (existingAnswerIndex >= 0) {
     
      submission.answers[existingAnswerIndex] = newAnswer;
    } else {
      
      submission.answers.push(newAnswer);
    }

    await submission.save();

    res.status(200).json({ message: "Answer submitted", answer: newAnswer });
  } catch (error) {
    console.error("Error submitting answer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const completeQuiz = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const student = req.user;

    
    if (student.userType !== "student") {
      return res.status(403).json({ message: "Only students can complete quizzes" });
    }

    
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

   
    if (submission.student.toString() !== student._id.toString()) {
      return res.status(403).json({ message: "This is not your submission" });
    }

    
    if (submission.status !== "in-progress") {
      return res.status(400).json({ message: "This quiz has already been completed" });
    }

   
    submission.status = "completed";
    submission.completedAt = new Date();
    
    
    const quiz = await Quiz.findById(submission.quiz).populate({
      path: 'classId',
      populate: { path: 'teacher' }
    });
    
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    
    
    const questionMap = {};
    quiz.questions.forEach(q => {
      questionMap[q._id.toString()] = q;
    });
    
    
    let hasShortAnswers = false;
    let totalScore = 0;
    
    for (const answer of submission.answers) {
      const question = questionMap[answer.questionId.toString()];
      
      if (!question) continue; 
      
      if (question.questionType === "short-answer") {
        
        hasShortAnswers = true;
        answer.isCorrect = null; 
        answer.points = 0;
      } else {
        let submittedAnswer = answer.answer;
        let correctAnswer = question.correctAnswer;
        
        if (question.questionType === "true-false") {
          
          if (typeof submittedAnswer === "string") {
            submittedAnswer = submittedAnswer === "true";
          }
          if (typeof correctAnswer === "string") {
            correctAnswer = correctAnswer === "true";
          }
        }
        
     
        answer.isCorrect = submittedAnswer === correctAnswer;
        answer.points = answer.isCorrect ? question.points : 0;
        totalScore += answer.points;
      }
    }
    
    
    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    submission.totalPoints = totalPoints;
    submission.totalScore = totalScore;
    
  
    if (!hasShortAnswers) {
      submission.isGraded = true;
      submission.status = "graded";
    }
    
    await submission.save();

    
    const teacherId = quiz.classId.teacher._id;
    const teacherName = quiz.classId.teacher.fullName || 'Teacher';
    const className = quiz.classId.name;
    const studentName = student.fullName || 'A student';
    
    
    const notificationTitle = `Quiz Submission: ${quiz.title}`;
    const notificationMessage = `${studentName} has submitted the quiz "${quiz.title}" in class "${className}"${hasShortAnswers ? ' and it requires grading.' : '.'}`;
    
    await createNotification(
      teacherId,
      "quiz-submission", 
      notificationTitle,
      notificationMessage,
      null,  
      null   
    );

    
    const submissionResponse = {
      ...submission.toObject(),
      gradingSummary: {
        totalQuestions: quiz.questions.length,
        answeredQuestions: submission.answers.length,
        autoGradedQuestions: submission.answers.filter(a => a.isCorrect !== null).length,
        needsManualGrading: submission.answers.filter(a => a.isCorrect === null).length,
        isFullyGraded: submission.isGraded,
        scorePercentage: totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0
      }
    };
    
    // Prepare quiz with answers and correct answers
    const quizWithAnswers = {
      ...quiz.toObject(),
      questions: quiz.questions.map(q => {
        const submittedAnswer = submission.answers.find(
          a => a.questionId.toString() === q._id.toString()
        );
        return {
          ...q,
          submittedAnswer: submittedAnswer ? submittedAnswer.answer : null,
          isCorrect: submittedAnswer ? submittedAnswer.isCorrect : null,
          points: submittedAnswer ? submittedAnswer.points : 0,
          maxPoints: q.points,
          feedback: submittedAnswer ? submittedAnswer.feedback : ""
        };
      })
    };
    
    res.status(200).json({
      message: "Quiz completed successfully",
      submission: submissionResponse,
      quiz: quizWithAnswers,
      hasShortAnswers: hasShortAnswers
    });
  } catch (error) {
    console.error("Error completing quiz:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Grade a submission's short answer questions (teacher only)
export const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grades } = req.body; // Array of { questionId, points, feedback }
    const teacher = req.user;

    // Check if user is a teacher
    if (teacher.userType !== "teacher") {
      return res.status(403).json({ message: "Only teachers can grade submissions" });
    }

    // Find the submission with quiz and class information
    const submission = await Submission.findById(submissionId).populate({
      path: 'quiz',
      populate: { path: 'classId' }
    });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Check if teacher owns the class
    if (submission.quiz.classId.teacher.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: "You don't have permission to grade this submission" });
    }

    // Check if submission is completed (not in-progress)
    if (submission.status === "in-progress") {
      return res.status(400).json({ message: "Cannot grade an in-progress submission" });
    }

    // Find quiz for questions details
    const quiz = await Quiz.findById(submission.quiz._id);
    
    // Create a map of questions by ID for faster lookup
    const questionMap = {};
    quiz.questions.forEach(q => {
      questionMap[q._id.toString()] = q;
    });
    
    // Statistics for tracking grading status
    let totalShortAnswerQuestions = 0;
    let gradedShortAnswerCount = 0;
    let anyShortAnswerUngraded = false;
    
    // Process each grade in the request
    for (const grade of grades) {
      const { questionId, points, feedback } = grade;
      
      // Find the answer in the submission
      const answerIndex = submission.answers.findIndex(a => 
        a.questionId.toString() === questionId
      );
      
      if (answerIndex === -1) continue;
      
      // Find the question to get max points and type
      const question = questionMap[questionId];
      if (!question) continue;
      
      // Only proceed with grading if this is a short-answer question or if isCorrect is null
      if (question.questionType === "short-answer" || submission.answers[answerIndex].isCorrect === null) {
        totalShortAnswerQuestions++;
        
        // Validate points don't exceed max
        const validatedPoints = Math.min(Math.max(0, points || 0), question.points);
        
        // Update the answer with grade details
        submission.answers[answerIndex].points = validatedPoints;
        submission.answers[answerIndex].isCorrect = validatedPoints > 0;
        submission.answers[answerIndex].feedback = feedback || "";
        
        // Track graded questions
        if (validatedPoints > 0 || feedback) {
          gradedShortAnswerCount++;
        } else {
          anyShortAnswerUngraded = true;
        }
      }
    }
    
    // Recalculate total score from all answers
    submission.totalScore = submission.answers.reduce((sum, a) => sum + a.points, 0);
    
    // Update grading status
    if (totalShortAnswerQuestions > 0) {
      if (gradedShortAnswerCount === totalShortAnswerQuestions && !anyShortAnswerUngraded) {
        // All short answers have been graded
        submission.status = "graded";
        submission.isGraded = true;
      } else if (gradedShortAnswerCount > 0) {
        // Some grading has been done, but not all
        submission.status = "completed"; // Keep as completed, not fully graded
        submission.isGraded = false;
      }
    } else {
      // No short answer questions, should already be marked as graded
      submission.status = "graded";
      submission.isGraded = true;
    }
    
    await submission.save();
    
    // Prepare enriched submission response
    const enrichedSubmission = {
      ...submission.toObject(),
      gradingSummary: {
        totalQuestions: submission.answers.length,
        shortAnswerQuestions: totalShortAnswerQuestions,
        gradedQuestions: gradedShortAnswerCount,
        ungradedQuestions: totalShortAnswerQuestions - gradedShortAnswerCount,
        isFullyGraded: submission.isGraded,
        scorePercentage: submission.totalPoints > 0 
          ? Math.round((submission.totalScore / submission.totalPoints) * 100) 
          : 0
      }
    };
    
    res.status(200).json({
      message: "Submission graded successfully",
      submission: enrichedSubmission
    });
  } catch (error) {
    console.error("Error grading submission:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get quiz submissions (teacher only)
export const getQuizSubmissions = async (req, res) => {
  try {
    const { quizId } = req.params;
    const teacher = req.user;

    // Check if user is a teacher
    if (teacher.userType !== "teacher") {
      return res.status(403).json({ message: "Only teachers can view submissions" });
    }

    // Find the quiz and check ownership
    const quiz = await Quiz.findById(quizId).populate("classId");
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (quiz.classId.teacher.toString() !== teacher._id.toString()) {
      return res.status(403).json({ message: "You don't have permission to view these submissions" });
    }

    // Get all submissions for this quiz
    const submissions = await Submission.find({ quiz: quizId })
      .populate("student", "fullName email");

    res.status(200).json(submissions);
  } catch (error) {
    console.error("Error fetching quiz submissions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get a student's submission for a quiz (student or teacher)
export const getSubmission = async (req, res) => {
  try {
    const { quizId } = req.params;
    const user = req.user;

    const quiz = await Quiz.findById(quizId).populate("classId");
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const isTeacher = user.userType === "teacher" && quiz.classId.teacher.toString() === user._id.toString();
    const isStudent = user.userType === "student";

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ message: "You don't have permission to access this quiz" });
    }

    // Check if quiz is upcoming for students (important fix)
    if (isStudent) {
      const now = new Date();
      const startTime = new Date(quiz.startTime);
      if (now < startTime) {
        // For upcoming quizzes, return the quiz without a submission
        return res.status(200).json({
          message: "Quiz is upcoming",
          quiz: {
            ...quiz.toObject(),
            questions: quiz.questions.map(({ correctAnswer, ...questionData }) => questionData)
          },
          submission: null, // Return null instead of 404 for upcoming quiz submissions
          quizStatus: "upcoming"
        });
      }
    }

    // For students, only get their own submission
    let submission;
    if (isStudent) {
      submission = await Submission.findOne({
        quiz: quizId,
        student: user._id
      });
    } else {
      // For teachers, allow specifying student ID
      const { studentId } = req.query;
      if (!studentId) {
        return res.status(400).json({ message: "Student ID is required" });
      }
      
      submission = await Submission.findOne({
        quiz: quizId,
        student: studentId
      }).populate("student", "fullName email");
    }

    if (!submission) {
      // If the quiz is active but no submission exists yet
      if (isStudent) {
        const now = new Date();
        const startTime = new Date(quiz.startTime);
        const endTime = new Date(quiz.endTime);
        if (now >= startTime && now <= endTime) {
          return res.status(200).json({
            message: "No submission yet, quiz available to start",
            quiz: {
              ...quiz.toObject(),
              questions: quiz.questions.map(({ correctAnswer, ...questionData }) => questionData)
            },
            submission: null,
            quizStatus: "active"
          });
        }
      }
      
      return res.status(404).json({ message: "Submission not found" });
    }

    // If submission is completed, include correct answers
    if (submission.status !== "in-progress") {
      const fullQuiz = await Quiz.findById(quizId);
      const quizWithAnswers = {
        ...fullQuiz.toObject(),
        questions: fullQuiz.questions.map(q => {
          const submittedAnswer = submission.answers.find(
            a => a.questionId.toString() === q._id.toString()
          );
          return {
            ...q,
            submittedAnswer: submittedAnswer ? submittedAnswer.answer : null,
            isCorrect: submittedAnswer ? submittedAnswer.isCorrect : null,
            points: submittedAnswer ? submittedAnswer.points : 0,
            maxPoints: q.points, // Explicitly include max points for clarity
            feedback: submittedAnswer ? submittedAnswer.feedback : ""
          };
        })
      };
      
      return res.status(200).json({
        submission,
        quiz: quizWithAnswers
      });
    }

    res.status(200).json({ submission });
  } catch (error) {
    console.error("Error fetching submission:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all quiz submissions for a student in a class
export const getStudentClassSubmissions = async (req, res) => {
  try {
    const { classId } = req.params;
    const user = req.user;

    // Check if the class exists
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Check if the user is enrolled in the class or is the teacher
    const isTeacher = classObj.teacher.toString() === user._id.toString();
    const isStudent = classObj.students.some(id => id.toString() === user._id.toString());

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ message: "You don't have permission to access this class" });
    }

    // Get the studentId (either the current user if student, or from query if teacher)
    let studentId = user._id;
    if (isTeacher && req.query.studentId) {
      studentId = req.query.studentId;
    } else if (isTeacher && !req.query.studentId) {
      return res.status(400).json({ message: "Student ID is required for teachers" });
    }

    // Get all published quizzes in the class
    const quizzes = await Quiz.find({ 
      classId, 
      isPublished: true 
    });

    if (quizzes.length === 0) {
      return res.status(200).json({
        quizzes: [],
        submissions: []
      });
    }

    // Get all submissions for these quizzes
    const quizIds = quizzes.map(quiz => quiz._id);
    const submissions = await Submission.find({
      quiz: { $in: quizIds },
      student: studentId,
      status: { $ne: "in-progress" } // Only include completed submissions
    });

    // Combine quiz data with submission data
    const quizResults = quizzes.map(quiz => {
      const submission = submissions.find(sub => sub.quiz.toString() === quiz._id.toString());
      
      return {
        quizId: quiz._id,
        title: quiz.title,
        description: quiz.description,
        startTime: quiz.startTime,
        endTime: quiz.endTime,
        totalPoints: submission ? submission.totalPoints : quiz.questions.reduce((sum, q) => sum + q.points, 0),
        status: submission ? submission.status : "not-started",
        score: submission ? submission.totalScore : null,
        isGraded: submission ? submission.isGraded : false,
        completedAt: submission ? submission.completedAt : null,
      };
    });

    res.status(200).json({
      className: classObj.name,
      quizResults
    });
  } catch (error) {
    console.error("Error fetching student class submissions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};