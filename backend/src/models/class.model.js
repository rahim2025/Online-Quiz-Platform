import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        students: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        enrollmentCode: {
            type: String,
            required: true,
            unique: true
        }
    },
    { timestamps: true }
);

const Class = mongoose.model("Class", classSchema);
export default Class;