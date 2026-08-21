# CCC Prep Admin Panel — SRS

## 1. Project Overview

Build a responsive admin dashboard for managing all content used by the CCC Prep React Native mobile application.

Admin panel stack:

- React
- Vite
- TypeScript
- Tailwind CSS
- Supabase
- React Router
- Supabase Auth
- Responsive desktop/tablet/mobile UI
- Dark theme with premium Lavender accent

The admin panel is separate from the mobile user's authentication system. Only authorized admin accounts can access it.

## 2. Admin Authentication

Authentication must use Supabase Auth.

Required:

- Admin login
- Logout
- Protected routes
- Persistent session
- Unauthorized users redirected to login
- Admin role verification
- Forgot password/reset password
- Session expiration handling

Do NOT allow normal mobile users to access the admin panel.

Recommended:
Use an `admin_users` table linked to `auth.users` with:

- id
- user_id
- name
- role
- is_active
- created_at
- updated_at

Supported roles:

- super_admin
- editor

## 3. Dashboard

Dashboard should display:

- Total questions
- Total test categories
- Total test series
- Total test sets
- Total PDF notes
- Total blogs
- Total books
- Total enrolled users
- Featured series
- Recent content
- Published/unpublished content counts

## 4. Test Management

### Test Categories

CRUD:

- Create
- Read
- Update
- Delete
- Activate/deactivate
- Reorder

Fields:

- title
- is_active
- sort_order

### Test Series

CRUD fields:

- category
- title
- featured
- featured tag
- featured short description
- total sets
- total enrolled
- paid/free
- price
- currency
- created date
- updated date

Features:

- Search
- Category filter
- Featured filter
- Pagination
- Publish/unpublish
- Delete confirmation

### Test Series Items

Manage individual test sets:

- Series
- Title
- Test type
- Question count
- Duration
- Difficulty
- Total marks
- Negative marking
- Negative marks
- Published status

Admin must be able to:

- Create set
- Edit set
- Delete set
- Publish/unpublish
- Assign/reorder questions

## 5. Chapter Management

CRUD:

- Chapter title
- Hindi title
- Description
- Active status
- Sort order

Chapter selection must be available while creating/editing questions.

## 6. Question Bank

Central question bank used by all test systems and Daily Quiz.

CRUD fields:

- Chapter
- Question English
- Question Hindi
- Option A English/Hindi
- Option B English/Hindi
- Option C English/Hindi
- Option D English/Hindi
- Correct option
- Explanation English/Hindi
- Difficulty
- Question type
- Source
- Active status
- Test assignments

Features:

- Search questions
- Filter by chapter
- Filter by difficulty
- Filter by test
- Bulk selection
- Assign questions to test sets
- Remove questions from sets
- Question preview
- Pagination
- Delete confirmation

Question assignment must preserve `question_order`.

## 7. PDF Notes Management

### Note Categories

CRUD:

- Title
- Hindi title
- Active
- Sort order

### Notes

CRUD:

- Category
- Title
- Hindi title
- Description
- Hindi description
- PDF upload
- Thumbnail upload
- File name
- File size
- Page count
- Featured
- Active

Use Supabase Storage for PDFs and images.

Admin actions:

- Upload
- Replace PDF
- Preview
- Delete
- Activate/deactivate

## 8. Blog Management

### Blog Categories

CRUD:

- Title
- Hindi title
- Active
- Sort order

### Blogs

CRUD:

- Category
- English title
- Hindi title
- Slug
- English summary
- Hindi summary
- English content
- Hindi content
- Featured image
- Author
- Featured
- Published/unpublished
- Published date

Features:

- Rich text editor
- Draft support
- Preview
- Publish
- Unpublish
- Search/filter
- Delete

## 9. Books / Affiliate Management

### Book Categories

CRUD:

- Title
- Hindi title
- Active
- Sort order

### Books

CRUD:

- Category
- Title
- Hindi title
- Author
- Description
- Hindi description
- Cover image
- Language
- Pages
- Edition
- Publisher
- ISBN
- Featured
- Active

### Book Links

Multiple retailers per book:

- Platform
- Affiliate URL
- Price
- Currency
- Availability

Supported platforms initially:

- Amazon
- Flipkart
- Other

Admin can add/remove retailer links independently.

## 10. Enrollment Management

Admin should be able to view:

- Total enrolled users
- Series-wise enrollment count
- User enrollment list
- Enrollment date
- Access type
- Status

Do not implement payment processing yet, but UI/database must support future paid series.

## 11. Search / Filtering

Every major listing page must support:

- Search
- Sorting
- Filters
- Pagination
- Active/inactive filtering
- Empty states
- Loading states
- Error states

## 12. UI/UX

Design language:

- Dark premium UI
- Lavender primary accent
- Responsive sidebar
- Collapsible mobile menu
- Cards with subtle borders
- Rounded corners
- Modern typography
- Accessible contrast
- Toast notifications
- Confirmation dialogs
- Skeleton loaders

Desktop: sidebar + top header.
Mobile: drawer menu + compact header.

## 13. Security

- Supabase RLS
- Admin-only data modification
- Role-based access
- Never expose service-role key in frontend
- Validate all forms
- Protect storage operations
- Confirm destructive actions

## 14. Code Architecture

Use:

- Feature-based folders
- Reusable UI components
- Reusable data-table component
- Reusable modal/form components
- Central Supabase client
- TypeScript types
- React hooks
- Constants for routes/status/options
- Proper loading/error/empty states

Suggested structure:

src/
├── components/
├── layouts/
├── pages/
├── features/
├── hooks/
├── lib/
├── services/
├── types/
├── constants/
└── routes/

## 15. Acceptance Criteria

Admin must be able to manage all current mobile-app content without manually editing the database.

A completed system must support:
Authentication → Dashboard → Tests → Questions → Notes → Blogs → Books → Enrollments, with full CRUD, responsive design, validation, search, filters, Supabase integration, and secure admin-only access.
