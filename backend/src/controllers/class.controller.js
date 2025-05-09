import Class from "../models/class.model.js";
import User from "../models/user.model.js";
import { generateRandomCode } from "../lib/generateCode.js";

// Create a new class (teacher only)
export const createClass = async (req, res) => {
  try {
    const { name, description } = req.body;
    const user = req.user;

    // Check if user is a teacher
    if (user.userType !== "teacher") {
      return res.status(403).json({
        message: "Only teachers can create classes"
      });
    }

    // Generate a unique enrollment code
    const enrollmentCode = generateRandomCode(6);
    
    const newClass = new Class({
      name,
      description,
      teacher: user._id,
      enrollmentCode
    });

    await newClass.save();
    
    return res.status(201).json(newClass);
  } catch (error) {
    console.error("Error creating class:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Get all classes for a teacher
export const getTeacherClasses = async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user is a teacher
    if (user.userType !== "teacher") {
      return res.status(403).json({
        message: "Only teachers can access this endpoint"
      });
    }
    
    const classes = await Class.find({ teacher: user._id });
    
    return res.status(200).json(classes);
  } catch (error) {
    console.error("Error getting teacher classes:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Enroll in a class using enrollment code (student only)
export const enrollInClass = async (req, res) => {
  try {
    const { enrollmentCode } = req.body;
    const user = req.user;
    
    // Check if user is a student
    if (user.userType !== "student") {
      return res.status(403).json({
        message: "Only students can enroll in classes"
      });
    }
    
    const classToEnroll = await Class.findOne({ enrollmentCode });
    
    if (!classToEnroll) {
      return res.status(404).json({
        message: "Class not found with this enrollment code"
      });
    }
    
    // Check if student is already enrolled
    if (classToEnroll.students.includes(user._id)) {
      return res.status(400).json({
        message: "You are already enrolled in this class"
      });
    }
    
    // Add student to class
    classToEnroll.students.push(user._id);
    await classToEnroll.save();
    
    return res.status(200).json({
      message: "Successfully enrolled in class",
      class: classToEnroll
    });
  } catch (error) {
    console.error("Error enrolling in class:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Get all classes for a student
export const getStudentClasses = async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user is a student
    if (user.userType !== "student") {
      return res.status(403).json({
        message: "Only students can access this endpoint"
      });
    }
    
    const classes = await Class.find({ students: user._id })
      .populate("teacher", "fullName email");
    
    return res.status(200).json(classes);
  } catch (error) {
    console.error("Error getting student classes:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Get class details (including enrolled students)
export const getClassDetails = async (req, res) => {
  try {
    const { classId } = req.params;
    const user = req.user;
    
    const classDetails = await Class.findById(classId)
      .populate("teacher", "fullName email")
      .populate("students", "fullName email");
    
    if (!classDetails) {
      return res.status(404).json({
        message: "Class not found"
      });
    }
    
    // Check if user is the teacher or an enrolled student
    const isTeacher = classDetails.teacher._id.toString() === user._id.toString();
    const isStudent = classDetails.students.some(student => 
      student._id.toString() === user._id.toString()
    );
    
    if (!isTeacher && !isStudent) {
      return res.status(403).json({
        message: "You don't have permission to view this class"
      });
    }
    
    return res.status(200).json(classDetails);
  } catch (error) {
    console.error("Error getting class details:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};