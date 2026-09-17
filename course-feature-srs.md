# CCC Prep Admin Panel — Course Management Module

## 1. Objective

Add a complete Course Management module to the existing CCC Prep Admin Panel.

The admin must be able to create and manage structured courses containing:

- Lessons
- Notes
- Quizzes
- Tests

Courses can be:

- Free
- Paid

Paid courses will be prepared for future Razorpay integration.

The admin panel must manage course content without hardcoding content inside the React Native app.

---

# 2. Course Hierarchy

The course structure is:

Course
→ Modules
→ Lessons

Each module can contain:

- Lessons
- Notes
- Quiz
- Test

Existing database resources should be reused wherever possible.

Do NOT duplicate:

- Questions
- Notes
- Tests

Existing `questions`, `notes` and `test_series_items` should be referenced instead.

---

# 3. New Database Tables

The AI agent must create these tables if they do not already exist.

## 3.1 courses

Columns:

```text
id
title
title_hi
slug
description
description_hi
thumbnail
is_paid
price
currency
is_featured
is_published
sort_order
created_at
updated_at
```

Purpose:

Stores the main course information.

Example:

```text
CCC Complete Course 2026
Free/Paid
₹199
18 Modules
```

---

## 3.2 course_modules

Columns:

```text
id
course_id
title
title_hi
description
description_hi
sort_order
is_published
created_at
updated_at
```

Purpose:

Represents chapters/modules inside a course.

Example:

```text
CCC Complete Course
├── Computer Fundamentals
├── Operating System
├── Word Processing
├── Spreadsheet
└── Internet
```

---

## 3.3 course_lessons

Columns:

```text
id
module_id
title
title_hi
lesson_type
content
content_hi
video_url
duration_minutes
sort_order
is_free_preview
is_published
created_at
updated_at
```

`lesson_type`:

```text
text
video
mixed
```

Purpose:

Stores actual teaching lessons.

---

## 3.4 course_module_notes

Columns:

```text
id
module_id
note_id
sort_order
created_at
```

Purpose:

Maps existing `notes` to a course module.

Relationship:

```text
course_modules
      ↓
course_module_notes
      ↓
notes
```

The same PDF can therefore be used both in the Notes section and inside a course.

---

## 3.5 course_module_tests

Columns:

```text
id
module_id
test_id
sort_order
created_at
```

`test_id` references:

```text
test_series_items.id
```

Purpose:

Attach existing tests to a course module.

The test itself remains in the existing test system.

---

## 3.6 course_module_questions

Columns:

```text
id
module_id
question_id
sort_order
created_at
```

Purpose:

Allows an admin to explicitly select questions for a module quiz.

This is optional at runtime, but recommended for admin-controlled quizzes.

The actual question remains in the central `questions` table.

---

## 3.7 course_enrollments

Columns:

```text
id
user_id
course_id
access_type
status
enrolled_at
expires_at
created_at
```

`access_type`:

```text
free
paid
promotional
```

`status`:

```text
active
expired
revoked
```

Purpose:

Tracks which users have access to which courses.

---

## 3.8 course_payments

Columns:

```text
id
user_id
course_id
order_id
payment_id
signature
amount
currency
payment_gateway
status
paid_at
created_at
updated_at
```

`status`:

```text
pending
success
failed
refunded
```

`payment_gateway` initially:

```text
razorpay
```

Razorpay integration itself is NOT required in this admin-panel phase.

The table only prepares the database for future payment integration.

---

## 3.9 course_lesson_progress

Columns:

```text
id
user_id
course_id
module_id
lesson_id
is_completed
completed_at
created_at
updated_at
```

Purpose:

Track lesson completion and calculate course progress.

Unique combination should prevent duplicate progress records:

```text
user_id + lesson_id
```

---

# 4. Reuse Existing Tables

Do NOT create duplicate versions of these:

```text
questions
notes
test_series_items
```

Course resources should reference the existing tables.

Example:

```text
Course
  ↓
Module
  ├── Lesson
  ├── Existing Note
  ├── Existing Test
  └── Quiz Questions
```

---

# 5. Course Admin Pages

Add a new sidebar section:

```text
Courses
├── All Courses
├── Modules
├── Lessons
├── Enrollments
└── Payments
```

However, course content should preferably be managed hierarchically from the Course Detail screen.

---

# 6. Course List Page

Display:

- Course thumbnail
- Course title
- Paid/Free
- Price
- Module count
- Lesson count
- Enrollment count
- Featured
- Published
- Updated date

Filters:

- All
- Free
- Paid
- Published
- Draft
- Featured

Actions:

- View/Edit
- Duplicate
- Publish/Unpublish
- Delete

---

# 7. Create Course

Form fields:

Basic:

- Title
- Hindi title
- Slug
- Description
- Hindi description
- Thumbnail

Pricing:

- Free/Paid switch
- Price
- Currency

Publishing:

- Featured
- Published
- Sort order

Validation:

- Title required
- Slug unique
- Price required for paid courses
- Price must be >= 0
- Paid course cannot have zero price unless explicitly allowed

---

# 8. Course Builder

After creating a course, show a visual course builder:

```text
CCC Complete Course 2026

[ Course Settings ]

Module 1
Computer Fundamentals
├── Lesson 1
├── Lesson 2
├── Lesson 3
├── Notes
├── Quiz
└── Test

Module 2
Operating System
├── Lesson 1
├── Lesson 2
├── Notes
├── Quiz
└── Test
```

Admin can:

- Add module
- Edit module
- Delete module
- Reorder module
- Publish/unpublish module
- Add lesson
- Attach note
- Attach test
- Add quiz questions

Use drag-and-drop ordering if practical.

---

# 9. Module Management

Module form:

- Title
- Hindi title
- Description
- Hindi description
- Published
- Sort order

Inside module:

Tabs:

```text
Overview
Lessons
Notes
Quiz
Test
```

---

# 10. Lesson Management

Admin can create:

### Text Lesson

- English content
- Hindi content

### Video Lesson

- Video URL
- English description
- Hindi description
- Duration

### Mixed

- Text content
- Video URL

Fields:

```text
title
title_hi
lesson_type
content
content_hi
video_url
duration_minutes
is_free_preview
is_published
sort_order
```

---

# 11. Course Notes

Use an attachment selector.

Admin clicks:

```text
Add Note
```

Show existing notes from:

```text
notes
```

Features:

- Search notes
- Category filter
- Select note
- Attach
- Reorder
- Remove

Do NOT duplicate PDF records.

---

# 12. Course Tests

Use existing `test_series_items`.

Admin clicks:

```text
Add Test
```

Show:

- Search
- Series
- Difficulty
- Questions
- Duration
- Published status

Admin selects test and attaches it to the module.

---

# 13. Course Quiz

Two possible modes:

### Selected Questions

Admin manually selects questions from Question Bank.

Filters:

- Chapter
- Difficulty
- Search
- Question type

Selected questions receive:

```text
sort_order
```

### Dynamic Quiz

Future option:

Generate quiz dynamically from:

- module
- chapter
- difficulty
- number of questions

The admin panel should be structured so this can be added later without redesigning the course system.

---

# 14. Free Course

Free course:

```text
is_paid = false
price = 0
```

User should be able to enroll/start without payment.

Admin can view enrollments.

---

# 15. Paid Course

Paid course:

```text
is_paid = true
price = 199
currency = INR
```

Admin UI:

```text
Pricing
Paid Course
₹199
```

Payment gateway:

```text
Razorpay
```

Do NOT implement actual payment processing in this phase.

---

# 16. Course Enrollment Management

Admin page:

```text
Course Enrollments
```

Columns:

- User
- Email
- Course
- Access Type
- Status
- Enrollment Date
- Expiry Date

Filters:

- Course
- Active
- Expired
- Revoked
- Free
- Paid

Admin actions:

- View
- Revoke access
- Restore access

Do not allow arbitrary editing of payment records.

---

# 17. Payment Management

Admin page:

```text
Course Payments
```

Display:

- User
- Course
- Order ID
- Payment ID
- Amount
- Gateway
- Status
- Paid Date

Filters:

- Pending
- Success
- Failed
- Refunded

Payment records should be mostly read-only.

Only trusted server/payment-webhook processes should create or update payment status in production.

---

# 18. Course Progress

Admin can view:

```text
Course Progress

User:
Gaurav

Course:
CCC Complete Course

Progress:
64%

Completed:
12 / 18 Modules
84 / 120 Lessons
```

The frontend may calculate progress from `course_lesson_progress`.

Do not manually maintain progress percentages in database unless required for optimization.

---

# 19. Course Dashboard Statistics

Show:

- Total Courses
- Published Courses
- Draft Courses
- Free Courses
- Paid Courses
- Total Enrollments
- Active Enrollments
- Course Payments
- Revenue
- Most Popular Course

Revenue should be calculated only from successful payments.

---

# 20. Security

Admin operations must respect Supabase RLS.

Only:

```text
super_admin
editor
```

authorized admin users can modify course content.

Payment records should have stricter modification permissions.

Never expose Razorpay secret keys to the frontend.

---

# 21. UX Requirements

Course builder should be the main focus.

Use:

- Tabs
- Accordions
- Drag-and-drop
- Modal selectors
- Confirmation dialogs
- Toast notifications
- Skeleton loading
- Empty states
- Error states

Desktop:
Course builder can use a two-panel layout.

Mobile:
Stack modules and resources vertically with expandable sections.

---

# 22. Acceptance Criteria

Admin must be able to:

1. Create free/paid course.
2. Edit course.
3. Publish/unpublish.
4. Add/reorder/delete modules.
5. Add/reorder/delete lessons.
6. Attach existing notes.
7. Attach existing tests.
8. Select quiz questions.
9. View enrollments.
10. View payment records.
11. Manage access.
12. View course progress.
13. Publish the complete course.

No duplicate questions, notes or tests should be created for courses.
