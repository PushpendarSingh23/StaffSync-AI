import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required.'],
      trim: true,
      maxlength: [100, 'Full name must be 100 characters or fewer.'],
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    // Never returned in API responses — see toJSON transform below
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [8, 'Password must be at least 8 characters.'],
      select: false, // excluded from queries by default
    },
    role: {
      type: String,
      enum: { values: ['admin', 'employee'], message: 'Role must be admin or employee.' },
      default: 'employee',
    },
    // Optional link to an Employees document
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employees',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      // Strip password from every JSON serialisation, even if select:false is bypassed
      transform(_, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Hash password before saving whenever it has been modified
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method — safe to call on a document loaded with +password
UserSchema.methods.matchPassword = async function (plainText) {
  return bcrypt.compare(plainText, this.password);
};

export const User = mongoose.model('User', UserSchema);
