import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        type: {
            type: String,
            enum: ["quiz-published", "grade-available", "class-announcement", "quiz-submission"],
            required: true
        },
        title: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "relatedModel"
        },
        relatedModel: {
            type: String,
            enum: ["Quiz", "Class", "Submission"]
        },
        read: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;