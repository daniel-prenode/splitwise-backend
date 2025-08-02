import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface for User document
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for User model with static methods
export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  createUser(userData: { firstName: string; lastName: string; email: string; password: string }): Promise<IUser>;
}

// User schema definition
const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: true // We'll manually exclude this in queries where needed
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters long'],
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters long'],
    maxlength: [50, 'Last name cannot exceed 50 characters']
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  versionKey: false // Removes __v field
});

// Indexes for performance (email index is automatically created by unique: true)
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email: string): Promise<IUser | null> {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to create user with validation
userSchema.statics.createUser = async function(userData: { firstName: string; lastName: string; email: string; password: string }): Promise<IUser> {
  const user = new this(userData);
  return user.save();
};

// Transform output (remove password by default)
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  
  // Transform _id to id for consistency with frontend
  userObject.id = userObject._id;
  delete userObject._id;
  
  return userObject;
};

// Create and export the model
export const UserModel = mongoose.model<IUser, IUserModel>('User', userSchema);

// Legacy compatibility class for existing code
export class UserModelLegacy {
  static async findByEmail(email: string): Promise<any> {
    const user = await UserModel.findByEmail(email);
    if (!user) return undefined;
    
    return {
      id: user._id.toString(),
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt
    };
  }

  static async findById(id: string): Promise<any> {
    try {
      const user = await UserModel.findById(id);
      if (!user) return undefined;
      
      return {
        id: user._id.toString(),
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt
      };
    } catch (error) {
      return undefined;
    }
  }

  static async create(userData: { firstName: string; lastName: string; email: string; password: string }): Promise<any> {
    const user = await UserModel.createUser(userData);
    return {
      id: user._id.toString(),
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt
    };
  }

  static async getAllUsers(): Promise<any[]> {
    const users = await UserModel.find({}).select('-password');
    return users.map(user => ({
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt
    }));
  }
}
