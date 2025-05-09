import {z} from "zod";

export const validateUserSchema = z.object({
    fullName: z.string().min(1,"Name required"),
    email:z.string().email("Invalid email"),
    password:z.string().min(6,"minimum length is 6"),
    userType: z.enum(["student", "teacher"]),
    profilePic:z.string().optional(),
});

