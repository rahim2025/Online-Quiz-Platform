import express from "express";
import { 
  createQuiz,
  getClassQuizzes,
  getQuizDetails,
  updateQuiz,
  publishQuiz,
  startQuiz,
  submitAnswer,
  completeQuiz,
  gradeSubmission,
  getQuizSubmissions,
  getSubmission,
  getStudentClassSubmissions
} from "../controllers/quiz.controller.js";
import { protectRoute } from "../middlewares/protectRoute.js";

const router = express.Router();

// Quiz management routes (for teachers)
router.post("/create", protectRoute, createQuiz);
router.get("/class/:classId", protectRoute, getClassQuizzes);
router.get("/:quizId", protectRoute, getQuizDetails);
router.put("/:quizId", protectRoute, updateQuiz);
router.post("/:quizId/publish", protectRoute, publishQuiz);

// Quiz taking routes (for students)
router.post("/:quizId/start", protectRoute, startQuiz);
router.post("/submission/:submissionId/answer", protectRoute, submitAnswer);
router.post("/submission/:submissionId/complete", protectRoute, completeQuiz);

// Submission management routes
router.post("/submission/:submissionId/grade", protectRoute, gradeSubmission);
router.get("/:quizId/submissions", protectRoute, getQuizSubmissions);
router.get("/:quizId/submission", protectRoute, getSubmission);

// Marks summary routes
router.get("/class/:classId/marks", protectRoute, getStudentClassSubmissions);

export default router;