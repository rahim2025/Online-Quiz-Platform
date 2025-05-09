import mongoose from "mongoose";

// Schema for student responses to questions
const answerSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    answer: {
        type: mongoose.Schema.Types.Mixed, // Can be String, Boolean or Array depending on question type
        required: true
    },
    isCorrect: {
        type: Boolean,
        default: null // null for ungraded short answers
    },
    points: {
        type: Number,
        default: 0
    },
    feedback: {
        type: String,
        default: ""
    }
}, { _id: true });

// Main submission schema
const submissionSchema = new mongoose.Schema(
    {
        quiz: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quiz",
            required: true
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        answers: [answerSchema],
        startedAt: {
            type: Date,
            required: true,
            default: Date.now
        },
        completedAt: {
            type: Date
        },
        totalScore: {
            type: Number,
            default: 0
        },
        totalPoints: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ["in-progress", "completed", "graded"],
            default: "in-progress"
        },
        isGraded: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

// Index for efficient lookups
submissionSchema.index({ quiz: 1, student: 1 }, { unique: true });

const Submission = mongoose.model("Submission", submissionSchema);
export default Submission;