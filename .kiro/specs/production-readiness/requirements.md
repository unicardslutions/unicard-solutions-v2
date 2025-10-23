# Requirements Document

## Introduction

This specification addresses critical gaps identified in the UniCard Solutions platform audit. The system currently claims 100% completion but is actually ~75-80% complete. This spec will implement all missing features, fix placeholder implementations, and ensure true production readiness across web and mobile applications.

## Glossary

- **System**: The UniCard Solutions platform (web + mobile apps)
- **Web App**: React-based web application for template building and management
- **Mobile Apps**: React Native Expo apps (School App and Admin App)
- **Background Removal Service**: AI-powered service to remove backgrounds from student photos
- **Card Generation Service**: Service that generates ID cards from templates and student data
- **Offline Database**: WatermelonDB instance for offline data storage and sync
- **Excel Parser**: Service that parses Excel files containing student data
- **ZIP Extractor**: Service that extracts photos from ZIP archives
- **Sync Service**: Two-way synchronization between local and remote databases
- **Production Environment**: Live deployment accessible to end users

## Requirements

### Requirement 1: Background Removal Implementation

**User Story:** As a school administrator, I want to automatically remove backgrounds from student photos, so that ID cards have consistent professional appearance.

#### Acceptance Criteria

1. WHEN a user uploads a student photo, THE System SHALL provide a "Remove Background" button
2. WHEN the user clicks "Remove Background", THE System SHALL send the photo to a background removal API
3. WHEN the API processes the photo, THE System SHALL display a loading indicator with progress feedback
4. IF the background removal succeeds, THEN THE System SHALL display the processed photo with transparent background
5. IF the background removal fails, THEN THE System SHALL display an error message and retain the original photo
6. THE System SHALL support background removal for PNG and JPEG image formats
7. THE System SHALL process images up to 10MB in size
8. THE System SHALL complete background removal within 30 seconds or timeout with error
9. THE System SHALL allow users to restore the original photo after background removal
10. THE System SHALL store both original and processed photos in Supabase Storage

### Requirement 2: Mobile Card Generation Implementation

**User Story:** As a school administrator using the mobile app, I want to generate ID cards from templates, so that I can create cards on-the-go without using the web application.

#### Acceptance Criteria

1. WHEN a user selects a template and student data, THE Mobile App SHALL generate an ID card image
2. THE Mobile App SHALL convert SVG template data to PNG format with specified DPI
3. THE Mobile App SHALL convert SVG template data to PDF format for printing
4. THE Mobile App SHALL support DPI settings of 72, 150, 300, and 600
5. THE Mobile App SHALL generate cards with dimensions matching the template specifications
6. WHEN generating batch cards, THE Mobile App SHALL create a ZIP file containing all generated cards
7. THE Mobile App SHALL display generation progress for batch operations
8. THE Mobile App SHALL allow users to share generated cards via native share dialog
9. THE Mobile App SHALL allow users to save generated cards to device gallery
10. IF card generation fails, THEN THE Mobile App SHALL display specific error message and allow retry

### Requirement 3: Excel Import Implementation

**User Story:** As a school administrator using the mobile app, I want to import student data from Excel files, so that I can bulk-add students without manual entry.

#### Acceptance Criteria

1. WHEN a user selects an Excel file (.xlsx), THE Mobile App SHALL parse the file and extract data
2. THE Mobile App SHALL display the first 5 rows as preview before import
3. THE Mobile App SHALL auto-detect common column mappings (name, class, roll number, etc.)
4. THE Mobile App SHALL allow users to manually map Excel columns to student fields
5. THE Mobile App SHALL validate that required fields (name, class, roll_number) are mapped
6. THE Mobile App SHALL support Excel files with up to 1000 rows
7. THE Mobile App SHALL process Excel files up to 5MB in size
8. WHEN importing students, THE Mobile App SHALL insert data in batches of 50 records
9. THE Mobile App SHALL display import progress with count of processed records
10. IF import fails, THEN THE Mobile App SHALL display which records failed and allow retry

### Requirement 4: ZIP Photo Upload Implementation

**User Story:** As a school administrator using the mobile app, I want to upload student photos from a ZIP file, so that I can bulk-upload photos efficiently.

#### Acceptance Criteria

1. WHEN a user selects a ZIP file, THE Mobile App SHALL extract all image files from the archive
2. THE Mobile App SHALL support ZIP files up to 50MB in size
3. THE Mobile App SHALL extract PNG, JPEG, and JPG image formats
4. THE Mobile App SHALL auto-match photos to students by roll number in filename
5. THE Mobile App SHALL auto-match photos to students by name in filename
6. THE Mobile App SHALL display matched and unmatched photo counts
7. THE Mobile App SHALL allow users to manually assign unmatched photos to students
8. WHEN uploading photos, THE Mobile App SHALL upload to Supabase Storage in batches
9. THE Mobile App SHALL display upload progress with count of uploaded photos
10. IF upload fails for specific photos, THEN THE Mobile App SHALL display failed items and allow retry

### Requirement 5: WatermelonDB Offline Database Initialization

**User Story:** As a mobile app user, I want the app to work offline, so that I can manage students and orders without internet connection.

#### Acceptance Criteria

1. WHEN the Mobile App launches, THE System SHALL initialize the WatermelonDB database instance
2. THE System SHALL create database tables for students, orders, templates, schools, and advertisements
3. THE System SHALL create a sync_queue table for tracking pending changes
4. THE System SHALL create model classes for each database table
5. THE System SHALL establish database connection before rendering main UI
6. IF database initialization fails, THEN THE System SHALL display error and prevent app usage
7. THE System SHALL migrate existing schema versions automatically on app update
8. THE System SHALL store database files in device persistent storage
9. THE System SHALL encrypt sensitive data in the local database
10. THE System SHALL provide database reset functionality for troubleshooting

### Requirement 6: Offline Sync Service Implementation

**User Story:** As a mobile app user, I want my offline changes to sync automatically when online, so that my data stays consistent across devices.

#### Acceptance Criteria

1. WHEN the device connects to internet, THE Sync Service SHALL automatically start synchronization
2. THE Sync Service SHALL sync pending local changes to Supabase before pulling remote changes
3. THE Sync Service SHALL sync remote changes from Supabase to local database
4. THE Sync Service SHALL sync every 5 minutes when online and app is active
5. THE Sync Service SHALL handle sync conflicts using "server wins" strategy
6. THE Sync Service SHALL retry failed sync operations up to 3 times with exponential backoff
7. THE Sync Service SHALL display sync status indicator in the UI (syncing, synced, error)
8. THE Sync Service SHALL track last sync timestamp for each table
9. IF sync fails after max retries, THEN THE Sync Service SHALL log error and notify user
10. THE Sync Service SHALL allow users to manually trigger sync via pull-to-refresh

### Requirement 7: Template Builder Advanced Functions

**User Story:** As a template designer, I want to align, distribute, and layer template elements, so that I can create professional layouts efficiently.

#### Acceptance Criteria

1. WHEN multiple elements are selected, THE Template Builder SHALL enable alignment options
2. THE Template Builder SHALL align elements to left, center, right, top, middle, or bottom
3. THE Template Builder SHALL distribute elements horizontally or vertically with equal spacing
4. THE Template Builder SHALL group multiple elements into a single movable unit
5. THE Template Builder SHALL ungroup grouped elements back to individual elements
6. THE Template Builder SHALL bring selected element to front (highest z-index)
7. THE Template Builder SHALL send selected element to back (lowest z-index)
8. THE Template Builder SHALL move selected element forward one layer
9. THE Template Builder SHALL move selected element backward one layer
10. THE Template Builder SHALL preserve element properties when changing layer order

### Requirement 8: Production Code Quality

**User Story:** As a system administrator, I want production code to be clean and monitored, so that I can troubleshoot issues and maintain system health.

#### Acceptance Criteria

1. THE System SHALL remove all console.log statements from production builds
2. THE System SHALL use a structured logging service (e.g., Sentry) for error tracking
3. THE System SHALL log errors with context (user ID, action, timestamp, stack trace)
4. THE System SHALL implement proper error boundaries in React components
5. THE System SHALL validate all user inputs before processing
6. THE System SHALL sanitize all data before database insertion
7. THE System SHALL implement rate limiting on API endpoints
8. THE System SHALL implement request timeout handling (30 seconds max)
9. THE System SHALL implement retry logic with exponential backoff for failed requests
10. THE System SHALL display user-friendly error messages instead of technical errors

### Requirement 9: Revenue Tracking System

**User Story:** As an administrator, I want accurate revenue tracking, so that I can monitor business performance and financial metrics.

#### Acceptance Criteria

1. THE System SHALL create a payments table in the database
2. THE System SHALL record payment amount, method, status, and timestamp for each order
3. THE System SHALL calculate revenue from actual payment records, not estimated values
4. THE System SHALL display revenue metrics on admin dashboard (daily, weekly, monthly)
5. THE System SHALL support multiple payment methods (cash, online, bank transfer)
6. THE System SHALL track payment status (pending, completed, failed, refunded)
7. THE System SHALL allow admins to manually record payments
8. THE System SHALL generate revenue reports with date range filters
9. THE System SHALL display revenue by school, by template, and by time period
10. THE System SHALL export revenue data to CSV format

### Requirement 10: Push Notifications Testing and Validation

**User Story:** As a mobile app user, I want to receive notifications about order updates, so that I stay informed about my requests.

#### Acceptance Criteria

1. WHEN the Mobile App launches, THE System SHALL request notification permissions from user
2. WHEN permission is granted, THE System SHALL register device token with Supabase
3. WHEN an order status changes, THE System SHALL send push notification to school's device
4. WHEN a school is verified, THE System SHALL send push notification to school's device
5. THE System SHALL display notification badge count on app icon
6. WHEN user taps notification, THE System SHALL navigate to relevant screen (order details, etc.)
7. THE System SHALL handle notifications when app is in foreground, background, or closed
8. THE System SHALL store notification history in local database
9. THE System SHALL allow users to enable/disable notifications in settings
10. THE System SHALL test notifications on both iOS and Android devices

### Requirement 11: Comprehensive Error Handling

**User Story:** As a user, I want clear error messages and recovery options, so that I can resolve issues without frustration.

#### Acceptance Criteria

1. WHEN any operation fails, THE System SHALL display a user-friendly error message
2. THE System SHALL provide specific error messages for different failure types
3. THE System SHALL provide actionable recovery suggestions (retry, contact support, etc.)
4. THE System SHALL log detailed error information for debugging
5. THE System SHALL implement error boundaries to prevent app crashes
6. THE System SHALL display fallback UI when components fail to render
7. THE System SHALL handle network errors with offline mode indicators
8. THE System SHALL handle authentication errors with re-login prompts
9. THE System SHALL handle validation errors with field-specific messages
10. THE System SHALL implement global error handler for uncaught exceptions

### Requirement 12: Performance Optimization

**User Story:** As a user, I want the application to load quickly and respond smoothly, so that I can work efficiently.

#### Acceptance Criteria

1. THE Web App SHALL load initial page within 3 seconds on 3G connection
2. THE Mobile App SHALL launch within 2 seconds on mid-range devices
3. THE System SHALL implement lazy loading for images and heavy components
4. THE System SHALL implement code splitting to reduce initial bundle size
5. THE System SHALL cache frequently accessed data in memory
6. THE System SHALL optimize images before upload (resize, compress)
7. THE System SHALL implement pagination for lists with more than 50 items
8. THE System SHALL debounce search inputs to reduce API calls
9. THE System SHALL use React.memo and useMemo to prevent unnecessary re-renders
10. THE System SHALL achieve Lighthouse performance score of 90+ for web app

### Requirement 13: Security Hardening

**User Story:** As a system administrator, I want the application to be secure, so that user data is protected from unauthorized access.

#### Acceptance Criteria

1. THE System SHALL implement HTTPS for all API communications
2. THE System SHALL validate and sanitize all user inputs to prevent injection attacks
3. THE System SHALL implement CSRF protection for state-changing operations
4. THE System SHALL implement rate limiting to prevent brute force attacks
5. THE System SHALL encrypt sensitive data at rest in local database
6. THE System SHALL implement secure token storage using platform-specific secure storage
7. THE System SHALL implement session timeout after 30 minutes of inactivity
8. THE System SHALL log all authentication attempts for security auditing
9. THE System SHALL implement Content Security Policy headers
10. THE System SHALL pass OWASP security audit with no critical vulnerabilities

### Requirement 14: Testing Coverage

**User Story:** As a developer, I want comprehensive test coverage, so that I can deploy with confidence and catch bugs early.

#### Acceptance Criteria

1. THE System SHALL have unit tests for all utility functions
2. THE System SHALL have integration tests for all API endpoints
3. THE System SHALL have E2E tests for critical user flows
4. THE System SHALL achieve minimum 80% code coverage
5. THE System SHALL run tests automatically on every commit (CI/CD)
6. THE System SHALL prevent deployment if tests fail
7. THE System SHALL test offline functionality in mobile apps
8. THE System SHALL test sync conflicts and resolution
9. THE System SHALL test error scenarios and edge cases
10. THE System SHALL perform load testing for concurrent users

### Requirement 15: Documentation Updates

**User Story:** As a developer or user, I want accurate documentation, so that I can understand system capabilities and limitations.

#### Acceptance Criteria

1. THE Documentation SHALL accurately reflect actual implementation status
2. THE Documentation SHALL include "Known Limitations" section
3. THE Documentation SHALL include API documentation with examples
4. THE Documentation SHALL include deployment checklist with verification steps
5. THE Documentation SHALL include troubleshooting guide for common issues
6. THE Documentation SHALL include architecture diagrams
7. THE Documentation SHALL include database schema documentation
8. THE Documentation SHALL include mobile app setup instructions
9. THE Documentation SHALL include contribution guidelines
10. THE Documentation SHALL be versioned and kept in sync with code releases
