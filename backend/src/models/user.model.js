import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
    fullName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        unique:true,
        required:true
    },
    password:{
        type:String,
        minlength:6,
        required:true
    },
    userType:{
        type:String,
        enum:["student","teacher"],
    },
    profilePic:{
        type:String,
        default: "",
    }
},
{timestamps:true}
);

const User = mongoose.model("User",userSchema);
export default User;