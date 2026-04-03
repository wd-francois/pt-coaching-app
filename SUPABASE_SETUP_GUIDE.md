# Supabase Setup Guide - Step by Step

Follow these steps to migrate your app from IndexedDB to Supabase.

## Step 1: Create a Supabase Account and Project

1. Go to **https://supabase.com**
2. Click **"Start your project"** or **"Sign up"** (if you don't have an account)
3. Sign up with GitHub, Google, or email
4. Once logged in, click **"New Project"**
5. Fill in the project details:
   - **Name**: `PT Coaching App` (or your preferred name)
   - **Database Password**: Choose a strong password ⚠️ **SAVE THIS PASSWORD!**
   - **Region**: Choose the region closest to you (e.g., `US East (North Virginia)`)
   - **Pricing Plan**: Free tier is fine to start
6. Click **"Create new project"**
7. Wait 2-3 minutes for the project to be provisioned

## Step 2: Get Your API Credentials

1. Once your project is ready, go to **Settings** (gear icon in the left sidebar)
2. Click **"API"** in the settings menu
3. You'll see two important values:
   - **Project URL**: Looks like `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: A long string starting with `eyJ...`
4. **Copy both values** - you'll need them in the next step

## Step 3: Run the Database Migration

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Open the file `supabase/migrations/001_initial_schema.sql` from this project
4. **Copy the entire contents** of that file
5. **Paste it into the SQL Editor** in Supabase
6. Click **"Run"** (or press Ctrl+Enter)
7. You should see: **"Success. No rows returned"** - this means it worked!
8. Verify the tables were created:
   - Go to **"Table Editor"** in the left sidebar
   - You should see 5 tables: `clients`, `exercises`, `workouts`, `measurements`, `workout_templates`

## Step 4: Configure Environment Variables

1. In your project root folder, create a file named `.env` (if it doesn't exist)
2. Open `.env` in a text editor
3. Add these two lines (replace with YOUR values from Step 2):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Example:**
```
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI4MCwiZXhwIjoxOTU0NTQzMjgwfQ.example-key-here
```

⚠️ **Important**: 
- Don't use quotes around the values
- Don't add spaces around the `=` sign
- Make sure there are no extra spaces

## Step 5: Restart Your Development Server

1. **Stop** your current dev server (if running) - press `Ctrl+C` in the terminal
2. **Start it again**:
   ```bash
   npm run dev
   ```
3. The app should now connect to Supabase automatically!

## Step 6: Verify It's Working

1. Open your app in the browser (usually `http://localhost:5173`)
2. Check the browser console (F12 → Console tab)
3. You should see: **"Using Supabase database"** instead of "Supabase not configured, using IndexedDB"
4. Try creating a new client or exercise
5. Check your Supabase dashboard → **Table Editor** → you should see the new data appear!

## Step 7: (Optional) Migrate Existing Data

If you have existing data in IndexedDB that you want to move to Supabase:

1. Go to the **Statistics** page in your app
2. Click **"Export All Data"** to download your current data as JSON
3. After Supabase is set up, you can use the **"Import Data"** feature on the Statistics page to upload it

## Troubleshooting

### ❌ "Missing Supabase environment variables" error
- Make sure you created a `.env` file (not `.env.example`)
- Check that variable names start with `VITE_`
- Restart your dev server after creating/updating `.env`

### ❌ "Failed to fetch" or network errors
- Verify your Supabase URL is correct (should end with `.supabase.co`)
- Check your anon key is correct
- Make sure you ran the SQL migration (Step 3)
- Check Supabase dashboard → **Logs** for any errors

### ❌ Tables not showing up
- Go back to Step 3 and run the SQL migration again
- Check **Table Editor** in Supabase dashboard to verify tables exist

### ❌ Data not appearing
- Check browser console for errors
- Verify RLS policies are set correctly (they should be from the migration)
- Check Supabase dashboard → **Table Editor** to see if data is there

## Next Steps

Once Supabase is working:
- ✅ Your data is now stored in the cloud
- ✅ Accessible from any browser/device
- ✅ Automatically backed up
- 🔒 Consider adding authentication later for multi-user support
- 📊 Use Supabase dashboard to view/manage your data directly

## Need Help?

- Check Supabase logs: Dashboard → **Logs**
- Review your SQL migration: `supabase/migrations/001_initial_schema.sql`
- Supabase Docs: https://supabase.com/docs
