import express from "express";
import { createClass, enrollInClass, getTeacherClasses, getStudentClasses, getClassDetails } from "../controllers/class.controller.js";
import { protectRoute } from "../middlewares/protectRoute.js";

const router = express.Router();

// Teacher routes
router.post("/create", protectRoute, createClass);
router.get("/teacher-classes", protectRoute, getTeacherClasses);

// Student routes
router.post("/enroll", protectRoute, enrollInClass);
router.get("/student-classes", protectRoute, getStudentClasses);

// Common routes
router.get("/:classId", protectRoute, getClassDetails);

export default router;