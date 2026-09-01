const { z } = require("zod");

const itemReportSchema = z.object({
  title: z.string().trim().min(1, "title is required").max(120),
  description: z.string().trim().min(1, "description is required").max(2000),
  reportType: z.enum(["LOST", "FOUND"]),
  location: z.string().trim().min(1, "location is required").max(200),
  occurredAt: z.coerce.date({ invalid_type_error: "occurredAt must be a valid date" }),
  color: z.string().trim().max(50).optional(),
  brand: z.string().trim().max(50).optional(),
  categoryId: z.string().uuid("categoryId must be a valid UUID"),
});

module.exports = { itemReportSchema };
