# UniCard Solutions - Testing Guide

Comprehensive testing guide for all components of the UniCard Solutions platform.

## 🧪 Testing Overview

This guide covers testing for:
- ✅ **Web Application** (100% Complete)
- ⚠️ **Mobile Applications** (60% Complete - Basic structure)
- ✅ **Database & API** (100% Complete)
- ✅ **Authentication** (100% Complete)

## 🌐 Web Application Testing

### Prerequisites
- Web app running on `http://localhost:8080`
- Supabase database configured
- Test data available

### 1. Authentication Testing

#### 1.1 School Registration
**URL:** `/school-login`

**Test Steps:**
1. Navigate to school login page
2. Click "Register New School"
3. Fill in registration form:
   - School Name: "Test School"
   - Contact Person: "John Doe"
   - WhatsApp: "+1234567890"
   - Address: "123 Test St"
   - Area: "Test Area"
   - Pin Code: "12345"
   - Email: "test@school.com"
   - Password: "password123"
4. Click "Register"
5. Check email for verification link
6. Verify account in Supabase Dashboard

**Expected Results:**
- ✅ Registration form validates all fields
- ✅ Success message displayed
- ✅ Email verification sent
- ✅ School record created in database
- ✅ User redirected to login

#### 1.2 School Login
**Test Steps:**
1. Enter registered email and password
2. Click "Login"
3. Verify dashboard loads

**Expected Results:**
- ✅ Login successful
- ✅ Dashboard displays school data
- ✅ Navigation menu visible

#### 1.3 Admin Login
**URL:** `/admin-login`

**Test Steps:**
1. Navigate to admin login
2. Use admin credentials (create in Supabase)
3. Verify admin dashboard loads

**Expected Results:**
- ✅ Admin dashboard displays
- ✅ All admin features accessible
- ✅ School management visible

### 2. School Dashboard Testing

#### 2.1 Dashboard Data Display
**URL:** `/school/dashboard`

**Test Steps:**
1. Login as school user
2. Verify dashboard statistics:
   - Total Students
   - Template Selected
   - Order Status
3. Check advertisement carousel
4. Verify action cards

**Expected Results:**
- ✅ Real-time data displayed
- ✅ Statistics update correctly
- ✅ Advertisements cycle properly
- ✅ Action cards link to correct pages

#### 2.2 Navigation Testing
**Test Steps:**
1. Click each navigation item
2. Verify pages load correctly
3. Test back navigation

**Expected Results:**
- ✅ All pages load without errors
- ✅ Navigation state maintained
- ✅ Breadcrumbs work correctly

### 3. Student Management Testing

#### 3.1 Add Student
**URL:** `/school/add-student`

**Test Steps:**
1. Navigate to add student page
2. Fill in student form:
   - Name: "Jane Smith"
   - Class: "10th"
   - Section: "A"
   - Roll Number: "001"
   - Date of Birth: "2010-01-01"
   - Parent Name: "Bob Smith"
   - Parent Phone: "+1234567890"
3. Upload student photo
4. Test photo editor features:
   - Crop
   - Rotate
   - Adjust brightness/contrast
   - Background removal
5. Save student

**Expected Results:**
- ✅ Form validation works
- ✅ Photo upload successful
- ✅ Photo editor functions properly
- ✅ Student saved to database
- ✅ Success message displayed

#### 3.2 Student List
**URL:** `/school/students`

**Test Steps:**
1. Navigate to student list
2. Verify students display in table
3. Test search functionality
4. Test filter by class/section
5. Test edit/delete operations

**Expected Results:**
- ✅ Students display correctly
- ✅ Search filters results
- ✅ Filters work properly
- ✅ Edit/delete operations successful

#### 3.3 Bulk Import - Excel
**URL:** `/school/upload-excel`

**Test Steps:**
1. Create test Excel file with student data
2. Upload Excel file
3. Map columns correctly
4. Preview data
5. Import students

**Expected Results:**
- ✅ Excel file parsed correctly
- ✅ Column mapping interface works
- ✅ Data preview accurate
- ✅ Import successful
- ✅ Students added to database

#### 3.4 Bulk Import - Photos
**URL:** `/school/upload-photos`

**Test Steps:**
1. Create ZIP file with student photos
2. Upload ZIP file
3. Verify photo extraction
4. Match photos to students
5. Upload to storage

**Expected Results:**
- ✅ ZIP file extracted
- ✅ Photos matched by filename
- ✅ Manual assignment works
- ✅ Photos uploaded to Supabase Storage

### 4. Template Management Testing

#### 4.1 Template Selection
**URL:** `/school/select-template`

**Test Steps:**
1. Navigate to template selection
2. Browse available templates
3. Preview template
4. Select template for order
5. Verify template assigned

**Expected Results:**
- ✅ Templates display in grid
- ✅ Preview modal works
- ✅ Template selection successful
- ✅ Order updated with template

#### 4.2 Advanced Template Builder
**URL:** `/admin/template-builder`

**Test Steps:**
1. Login as admin
2. Navigate to template builder
3. Test canvas functionality:
   - Add text elements
   - Add image elements
   - Add shapes
   - Position and resize elements
4. Test import features:
   - Import Word document
   - Import Photoshop file
   - Import image
5. Test export features:
   - Export to JSON
   - Export to PDF
   - Export to PNG
6. Save template

**Expected Results:**
- ✅ Canvas manipulation works
- ✅ Import functions properly
- ✅ Export generates correct files
- ✅ Template saved to database

### 5. Order Management Testing

#### 5.1 Order Submission
**Test Steps:**
1. Add students to order
2. Select template
3. Navigate to order submission
4. Review order details
5. Submit order

**Expected Results:**
- ✅ Order details accurate
- ✅ Submission successful
- ✅ Order status updated
- ✅ Confirmation displayed

#### 5.2 Admin Order Management
**URL:** `/admin/orders`

**Test Steps:**
1. Login as admin
2. Navigate to order management
3. View all orders
4. Test filters and search
5. Update order status
6. View order details

**Expected Results:**
- ✅ Orders display correctly
- ✅ Filters work properly
- ✅ Status updates successful
- ✅ Order details accurate

### 6. Card Generation Testing

#### 6.1 Generate ID Cards
**Test Steps:**
1. Select template
2. Select students
3. Configure export settings:
   - DPI: 300
   - Quality: High
   - Format: PNG
4. Generate cards
5. Download ZIP file

**Expected Results:**
- ✅ Cards generated correctly
- ✅ Dynamic fields replaced
- ✅ QR codes generated
- ✅ Download successful
- ✅ Print quality optimal

#### 6.2 Print Export
**Test Steps:**
1. Generate cards
2. Test print export options:
   - PDF for Epson F530
   - PNG ZIP for batch printing
3. Verify print settings

**Expected Results:**
- ✅ Print formats correct
- ✅ DPI settings applied
- ✅ Bleed margins correct
- ✅ Files ready for printing

## 📱 Mobile Application Testing

### Prerequisites
- Mobile apps running via Expo
- Test device or emulator
- Supabase credentials configured

### 1. School App Testing

#### 1.1 Authentication
**Test Steps:**
1. Open school app
2. Test email/password login
3. Test Google Sign-In
4. Test biometric authentication
5. Test registration flow

**Expected Results:**
- ✅ Login successful
- ✅ Google Sign-In works
- ✅ Biometric auth functional
- ✅ Registration creates account

#### 1.2 Navigation
**Test Steps:**
1. Login to app
2. Test bottom tab navigation
3. Navigate between screens
4. Test back navigation

**Expected Results:**
- ✅ Tabs switch correctly
- ✅ Screens load properly
- ✅ Navigation state maintained

#### 1.3 Dashboard (Placeholder)
**Current Status:** Basic placeholder screen
**Test Steps:**
1. Verify dashboard displays
2. Check for any errors

**Expected Results:**
- ✅ Screen loads without errors
- ✅ Placeholder content visible

#### 1.4 Student Management (Pending Implementation)
**Current Status:** Placeholder screens
**Planned Features:**
- Add student form
- Student list with search
- Photo capture and editing
- Bulk import functionality

#### 1.5 Order Management (Pending Implementation)
**Current Status:** Placeholder screen
**Planned Features:**
- View current order
- Submit order
- Track order status

### 2. Admin App Testing

#### 2.1 Authentication
**Test Steps:**
1. Open admin app
2. Test admin login
3. Verify admin dashboard loads

**Expected Results:**
- ✅ Admin login successful
- ✅ Dashboard displays admin features

#### 2.2 School Management (Pending Implementation)
**Current Status:** Placeholder screen
**Planned Features:**
- View all schools
- Verify school accounts
- School statistics

#### 2.3 Order Management (Pending Implementation)
**Current Status:** Placeholder screen
**Planned Features:**
- View all orders
- Update order status
- Order analytics

## 🗄️ Database Testing

### 1. Data Integrity Testing

#### 1.1 Row Level Security
**Test Steps:**
1. Login as school user
2. Try to access other school's data
3. Verify data isolation

**Expected Results:**
- ✅ Schools can only see own data
- ✅ Students isolated by school
- ✅ Orders properly scoped

#### 1.2 Data Validation
**Test Steps:**
1. Try to insert invalid data
2. Test required field validation
3. Test data type validation

**Expected Results:**
- ✅ Invalid data rejected
- ✅ Required fields enforced
- ✅ Data types validated

### 2. Real-time Testing

#### 2.1 Live Updates
**Test Steps:**
1. Open two browser windows
2. Make changes in one window
3. Verify updates in other window

**Expected Results:**
- ✅ Changes appear in real-time
- ✅ No page refresh needed
- ✅ Data consistency maintained

## 🔧 API Testing

### 1. Supabase API Testing

#### 1.1 Authentication API
**Test Steps:**
1. Test login endpoint
2. Test registration endpoint
3. Test logout endpoint
4. Test token refresh

**Expected Results:**
- ✅ All endpoints respond correctly
- ✅ Tokens generated properly
- ✅ Session management works

#### 1.2 Database API
**Test Steps:**
1. Test CRUD operations
2. Test RLS policies
3. Test real-time subscriptions

**Expected Results:**
- ✅ CRUD operations successful
- ✅ RLS policies enforced
- ✅ Subscriptions work

## 🐛 Common Issues & Solutions

### Web Application Issues

#### Issue: "Cannot connect to Supabase"
**Solution:**
1. Check environment variables
2. Verify Supabase project is active
3. Check network connectivity

#### Issue: "Photo upload fails"
**Solution:**
1. Check file size limits
2. Verify storage bucket permissions
3. Check file format support

#### Issue: "Template builder not loading"
**Solution:**
1. Check browser console for errors
2. Verify Fabric.js/Konva.js loaded
3. Clear browser cache

### Mobile Application Issues

#### Issue: "App won't start"
**Solution:**
1. Clear Expo cache: `npx expo start --clear`
2. Check app.json configuration
3. Verify dependencies installed

#### Issue: "Authentication fails"
**Solution:**
1. Check Supabase credentials in app.json
2. Verify network connectivity
3. Check authentication configuration

### Database Issues

#### Issue: "RLS policy errors"
**Solution:**
1. Check policy definitions
2. Verify user roles
3. Test with different user types

#### Issue: "Migration fails"
**Solution:**
1. Check SQL syntax
2. Verify table dependencies
3. Apply migrations manually

## 📊 Test Results Template

### Test Execution Log

| Test Case | Status | Notes | Date |
|-----------|--------|-------|------|
| School Registration | ✅ Pass | All fields validated | 2025-10-23 |
| School Login | ✅ Pass | Authentication working | 2025-10-23 |
| Add Student | ✅ Pass | Photo upload successful | 2025-10-23 |
| Template Builder | ✅ Pass | Canvas manipulation works | 2025-10-23 |
| Card Generation | ✅ Pass | Cards generated correctly | 2025-10-23 |
| Mobile Auth | ⚠️ Partial | Basic auth works, features pending | 2025-10-23 |

### Performance Metrics

| Component | Load Time | Memory Usage | Notes |
|-----------|-----------|--------------|-------|
| Web App | < 2s | < 100MB | Good performance |
| Mobile App | < 3s | < 150MB | Acceptable |
| Database | < 500ms | N/A | Fast queries |

## 🚀 Automated Testing

### Running Tests

```bash
# Web application tests
cd unicard-creator-hub
npm run test

# Mobile app tests (when implemented)
cd unicard-school-app
npm run test

cd unicard-admin-app
npm run test
```

### Test Coverage Goals

- **Web Application**: 80%+ coverage
- **Mobile Apps**: 70%+ coverage (when implemented)
- **Database**: 90%+ coverage
- **API**: 85%+ coverage

## 📝 Test Reports

After testing, document results in:
- GitHub Issues for bugs
- Test execution logs
- Performance reports
- User feedback

---

*For additional testing scenarios or issues, see the [Troubleshooting Guide](TROUBLESHOOTING.md) or create a [GitHub Issue](https://github.com/unicardslutions/unicard-complete-system/issues).*
