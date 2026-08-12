import mongoose, { Schema } from 'mongoose';

const EmployeeSchema = new Schema(
  {
    firstname: {
      type: String,
      required: [true, 'First name is required.'],
      trim: true,
      maxlength: [50, 'First name must be 50 characters or fewer.'],
    },
    lastname: {
      type: String,
      required: [true, 'Last name is required.'],
      trim: true,
      maxlength: [50, 'Last name must be 50 characters or fewer.'],
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required.'],
      trim: true,
    },
    job: {
      type: String,
      required: [true, 'Job title is required.'],
      trim: true,
      maxlength: [100, 'Job title must be 100 characters or fewer.'],
    },
    // Fixed: was String — now properly typed as Date
    dateOfJoining: {
      type: Date,
      required: [true, 'Date of joining is required.'],
    },
    image: {
      type: String,
      required: [true, 'Image URL is required.'],
      trim: true,
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// getEmployees.js sorts by createdAt (desc) on every page of the paginated
// listing — without an index that's a full collection scan + in-memory sort
// on every request, which gets worse as the page number (skip) grows.
EmployeeSchema.index({ createdAt: -1 });

// searchEmployee.js filters with a case-insensitive $or regex across these
// four fields. `email` is already indexed via `unique: true` above; the rest
// were previously unindexed, forcing a collection scan per search request.
// NOTE: because the search regex is unanchored (matches mid-string, e.g.
// "smith" in "blacksmith"), Mongo can't use these as a classic left-anchored
// index scan for every query — anchored/prefix searches (e.g. "^john") do
// benefit directly. A MongoDB text index (or Atlas Search) would give more
// consistent gains for substring search at larger scale.
EmployeeSchema.index({ firstname: 1 });
EmployeeSchema.index({ lastname: 1 });
EmployeeSchema.index({ job: 1 });

export const Employees = mongoose.model('Employees', EmployeeSchema);
