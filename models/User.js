import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// defining the user schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        unique: true,
        sparse: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        default: 'user'
    },

    bio: String,
    avatar:  { type: String, default: "" },

    links: {
        twitter: String,
        linkedin: String,
        github: String,
        facebook: String,
        whatsapp: String,
        youtube: String,
    },

    resetToken: String,
    resetTokenExp: Date
}, { timestamps: true });

//Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

// Compare entered password with stored hash
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
