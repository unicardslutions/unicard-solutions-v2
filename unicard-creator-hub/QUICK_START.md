# 🚀 Quick Start Guide - UniCard Solutions

## Prerequisites Completed ✅
- ✅ Node.js and npm installed
- ✅ Git installed and repository cloned
- ✅ All dependencies installed (549 packages)
- ✅ Project builds successfully
- ✅ Development server ready

## Step 1: Configure Supabase

### Get Your Supabase Credentials
1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to Project Settings → API
3. Copy the following values:
   - **Project URL**: `https://lhakooumttauqzepyssu.supabase.co` (already in .env)
   - **Anon/Public Key**: Copy this key

### Update .env File
Open `.env` in the root directory and replace the placeholder:

```env
VITE_SUPABASE_URL=https://lhakooumttauqzepyssu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_actual_anon_key_here_from_supabase
```

## Step 2: Run Database Migrations

### Using Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard/project/lhakooumttauqzepyssu
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `supabase/migrations/20251010120000_add_advertisements_table.sql`
5. Click "Run" or press Ctrl+Enter

### Verify Tables Exist
In SQL Editor, run:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

You should see: `orders`, `profiles`, `schools`, `students`, `templates`, `user_roles`, `advertisements`

## Step 3: Create an Admin User (Optional but Recommended)

### In Supabase SQL Editor:
```sql
-- First, create a user through Supabase Auth Dashboard
-- Then run this to make them admin:

INSERT INTO user_roles (user_id, role)
VALUES ('your-user-id-from-auth-users', 'admin');

-- To find user IDs:
SELECT id, email FROM auth.users;
```

## Step 4: Start the Application

The dev server should already be running. If not:

```bash
npm run dev
```

Open your browser to: **http://localhost:8080**

## Step 5: Test the System

### Test School Registration
1. Go to http://localhost:8080
2. Click "School Login"
3. Click "Register" tab
4. Fill in the form:
   - School Name: Test School
   - Contact Person: John Doe
   - WhatsApp: +91 9876543210
   - Address: 123 Test Street
   - Area: Downtown
   - Pin Code: 123456
   - Email: test@school.com
   - Password: Test123!
5. Click "Register"
6. Check your email for verification link

### Test Adding Students
1. Login with your school account
2. Click "Add Student" card
3. Fill in student details
4. Click "Add Photo" to test the photo editor:
   - Upload a photo or use camera
   - Adjust brightness, contrast, saturation
   - Rotate if needed
   - Select background color
   - Click "Save Photo"
5. Click "Save Student"
6. View the student in "List Students"

### Test Dashboard Features
- View total students count
- Check order status
- Try different action cards
- Test the Help and About pages

## Common Issues & Solutions

### Issue: `.env` file not found
**Solution**: The file exists but might be hidden. Make sure hidden files are visible in your file explorer, or create it manually.

### Issue: Supabase connection error
**Solution**: 
1. Verify your Supabase key is correct in `.env`
2. Restart the dev server after updating `.env`
3. Check Supabase project is active

### Issue: "Module not found" errors
**Solution**: 
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Photos not uploading
**Solution**:
1. Check Supabase storage buckets exist
2. Verify RLS policies are set up
3. Check browser console for errors

## Project Structure

```
unicard-creator-hub/
├── src/
│   ├── pages/                 # All page components
│   │   ├── school/           # School-specific pages
│   │   │   ├── AddStudent.tsx
│   │   │   └── StudentList.tsx
│   │   ├── admin/            # Admin pages (future)
│   │   ├── SchoolDashboard.tsx
│   │   ├── SchoolLogin.tsx
│   │   ├── AdminLogin.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── Landing.tsx
│   │   ├── Help.tsx
│   │   ├── About.tsx
│   │   └── NotFound.tsx
│   ├── components/           # Reusable components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── PhotoEditor.tsx
│   │   ├── SchoolHeader.tsx
│   │   └── AdminHeader.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.tsx
│   │   ├── useOrder.tsx
│   │   └── use-mobile.tsx
│   ├── integrations/        # External services
│   │   └── supabase/
│   ├── lib/                 # Utility functions
│   │   └── utils.ts
│   ├── types/               # TypeScript types
│   │   └── template.ts
│   └── App.tsx             # Main app component
├── supabase/
│   ├── config.toml
│   └── migrations/
├── public/
├── .env                     # ⚠️ Add your Supabase key here
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Next Development Tasks

1. ✅ Complete basic school features (DONE)
2. 🔲 Implement Excel upload
3. 🔲 Implement ZIP photo upload
4. 🔲 Create template selection page
5. 🔲 Build template editor
6. 🔲 Add admin features
7. 🔲 Implement card generation
8. 🔲 Add print export

## Resources

- **Supabase Dashboard**: https://supabase.com/dashboard/project/lhakooumttauqzepyssu
- **Supabase Docs**: https://supabase.com/docs
- **shadcn/ui Components**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Router**: https://reactrouter.com

## Getting Help

- Check `IMPLEMENTATION_PROGRESS.md` for detailed progress
- Check `README_IMPLEMENTATION.md` for feature overview
- Review code comments in source files
- Test the Help page at http://localhost:8080/help

## Success Checklist

- [ ] Supabase key added to `.env`
- [ ] Database migrations executed
- [ ] Dev server running without errors
- [ ] Can access http://localhost:8080
- [ ] School registration works
- [ ] Can add students with photos
- [ ] Dashboard shows real data
- [ ] Photo editor works
- [ ] Navigation between pages works

---

**🎉 You're all set!** The foundation is built and working. Continue with implementing the remaining features as outlined in the plan.

**Current Status:** ~40% Complete | Build: ✅ Passing | Ready for Development

**Development Server:** http://localhost:8080

