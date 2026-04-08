import { z } from 'zod';

// Common validation schemas
export const dateSchema = z.string().refine((date) => {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}, { message: "Invalid date format" });

export const nameSchema = z.string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be less than 100 characters")
  .regex(/^[a-zA-Z\s.-]+$/, "Name can only contain letters, spaces, dots, and hyphens");

export const emailSchema = z.string()
  .min(5, "Email must be at least 5 characters")
  .max(100, "Email must be less than 100 characters")
  .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 
    "Invalid email format (e.g., user@domain.com)");

export const userTypeSchema = z.enum(["Faculty", "Student", "faculty", "student"], {
  errorMap: () => ({ message: "User type must be either Faculty or Student" })
}).transform((val) => val.charAt(0).toUpperCase() + val.slice(1).toLowerCase());

export const yearLevelSchema = z.any().optional().transform((val) => {
  if (!val || val === "" || val === null || val === undefined) return null;
  if (typeof val === 'string' && /^(1|2|3|4|5)$/.test(val)) {
    return `${val} Year`;
  }
  return val; // Return as-is if not matching expected format
});

export const purposeSchema = z.string()
  .min(3, "Purpose must be at least 3 characters")
  .max(500, "Purpose must be less than 500 characters");

// Lab request and equipment borrow forms are no longer supported

// Software Installation Validation
export const softwareInstallationSchema = z.object({
  date: dateSchema,
  faculty_name: nameSchema,
  laboratory: z.string().min(1, "Laboratory is required"),
  software_list: z.string().min(5, "Software list must be at least 5 characters"),
  requested_by: nameSchema,
  installation_remarks: z.string().max(500, "Remarks must be less than 500 characters").optional().nullable(),
  prepared_by: z.string().optional().nullable()
});

// Complaint Validation
export const complaintSchema = z.object({
  lab_id: z.number().positive("Lab ID must be a positive number"),
  workstation_id: z.number().positive().optional().nullable(),
  asset_id: z.number().positive().optional().nullable(),
  faculty_student_name: nameSchema,
  user_type: userTypeSchema,
  year_level: yearLevelSchema,
  issue_description: z.string()
    .min(3, "Issue description must be at least 3 characters")
    .max(500, "Issue description must be less than 500 characters"),
  asset_info: z.string().max(100, "Asset info must be less than 100 characters").optional().nullable()
});

// Validation middleware
export const validate = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errorMessages
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid request data'
      });
    }
  };
};
