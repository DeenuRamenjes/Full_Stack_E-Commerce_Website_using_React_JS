import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    firstName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    password: {
        type: String,
        required: function() {
            return !this.clerkId; // Password is required only if not using Clerk
        }
    },
    clerkId: {
        type: String,
        unique: true,
        sparse: true // Allows null values while maintaining uniqueness
    },
    clerkData: {
        type: Object
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    refreshToken: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre("save", async function(next) {
    if (!this.isModified("password") || !this.password) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.refreshToken;
    return userObject;
};

const User = mongoose.model("User", userSchema);

export default User;