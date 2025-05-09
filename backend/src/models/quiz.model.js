import mongoose from "mongoose";

// Schema for quiz questions
const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true
    },
    questionType: {
        type: String,
        enum: ["multiple-choice", "true-false", "short-answer"],
        required: true
    },
    options: [String], // For multiple choice questions
    correctAnswer: {
        type: mongoose.Schema.Types.Mixed, // Can be String, Boolean, or Array depending on question type
        required: function() {
            return this.questionType !== "short-answer"; // Not required for short answer questions
        }
    },
    points: {
        type: Number,
        default: 1
    }
}, { _id: true });

// Main quiz schema
const quizSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            default: ""
        },
        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class",
            required: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        questions: [questionSchema],
        duration: {
            type: Number, // Duration in minutes
            required: true,
            min: 1
        },
        startTime: {
            type: Date,
            required: true
        },
        endTime: {
            type: Date,
            required: true
        },
        isPublished: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;