# 🏆 KEN MEDIA CREATIVE STUDIO
## Complete Setup Guide — Termux + GitHub + Vercel

---

## 📱 PART 1: TERMUX SETUP (Android)

### Step 1 — Install Termux
Download Termux from F-Droid (NOT Play Store — outdated there):
https://f-droid.org/en/packages/com.termux/

### Step 2 — Setup Termux
```bash
# Update packages
pkg update && pkg upgrade -y

# Install required tools
pkg install nodejs-lts git curl -y

# Verify versions
node --version   # Should be 18+
npm --version    # Should be 9+
git --version
```

### Step 3 — Clone or Transfer Project
```bash
# Option A: Clone from GitHub (after pushing)
git clone https://github.com/YOUR_USERNAME/ken-media-creative-studio.git
cd ken-media-creative-studio

# Option B: Transfer files via Termux storage
termux-setup-storage
cp -r /sdcard/ken-media ~/ken-media
cd ~/ken-media
```

### Step 4 — Install Dependencies
```bash
npm install --legacy-peer-deps
```

### Step 5 — Setup Environment Variables
```bash
# Copy the example env file
cp .env.example .env.local

# Edit with nano
nano .env.local
# Fill in all your Firebase keys (see Part 2)
# Press CTRL+X, then Y, then ENTER to save
```

### Step 6 — Run Development Server
```bash
npm run dev
# App runs at http://localhost:3000
# Open browser and go to: http://localhost:3000
```

---

## 🔥 PART 2: FIREBASE SETUP

### Step 1 — Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Name it: `ken-media-creative-studio`
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2 — Enable Authentication
1. In Firebase Console → Authentication → Get Started
2. Sign-in Providers → Enable:
   - ✅ Email/Password
   - ✅ Google

### Step 3 — Create Firestore Database
1. Firebase Console → Firestore Database → Create database
2. Choose "Start in production mode"
3. Select region: `europe-west1` (closest to Zambia)
4. Click Enable

### Step 4 — Setup Firebase Storage
1. Firebase Console → Storage → Get Started
2. Choose "Start in production mode"
3. Click Done

### Step 5 — Get Your Config Keys
1. Firebase Console → Project Settings (gear icon)
2. Scroll to "Your apps" → Web app → Add app
3. Register app name: `ken-media-web`
4. Copy the firebaseConfig object

### Step 6 — Upload Security Rules
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login --no-localhost

# Initialize (in project folder)
firebase init

# Select: Firestore, Storage, Hosting
# Use existing project: ken-media-creative-studio

# Deploy rules
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### Step 7 — Fill .env.local
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ken-media-creative-studio.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ken-media-creative-studio
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ken-media-creative-studio.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abc123

OPENAI_API_KEY=sk-...
NEXT_PUBLIC_ADMIN_EMAIL=youremail@gmail.com

NEXT_PUBLIC_AIRTEL_NUMBER=0570109056
NEXT_PUBLIC_MTN_NUMBER=0761468402
NEXT_PUBLIC_BANK_ACCOUNT=0136496126029
NEXT_PUBLIC_WHATSAPP=0772799672
NEXT_PUBLIC_FACEBOOK_URL=https://www.facebook.com/DjTizzyBeats
NEXT_PUBLIC_APP_URL=https://your-vercel-url.vercel.app
```

### Step 8 — Set Admin Role in Firestore
After registering with your admin email:
1. Go to Firebase Console → Firestore
2. Open the `users` collection
3. Find your user document
4. Edit `role` field → change to `"admin"`

---

## 🌿 PART 3: GITHUB SETUP

```bash
# In your project folder (Termux or PC)
cd ken-media

# Initialize git
git init
git add .
git commit -m "🚀 Initial commit: Ken Media Creative Studio"

# Create repo on GitHub.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/ken-media-creative-studio.git
git branch -M main
git push -u origin main

# After making changes:
git add .
git commit -m "feat: describe your change"
git push
```

---

## 🚀 PART 4: VERCEL DEPLOYMENT

### Option A — Vercel CLI (Termux)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: ken-media-creative-studio
# - Directory: ./
# - Override settings? No

# For production deployment:
vercel --prod
```

### Option B — Vercel Dashboard (Easier)
1. Go to https://vercel.com
2. Sign up / Login with GitHub
3. Click "New Project"
4. Import your GitHub repo
5. Framework: Next.js (auto-detected)
6. Add Environment Variables (all from .env.local)
7. Click "Deploy"

### After Deployment
- Your site is live at: `https://ken-media-creative-studio.vercel.app`
- Custom domain: Vercel → Domains → Add `kenmedia.zm`

---

## 📸 CEO PHOTO SETUP

Add Ken West's photo to the project:

```bash
# Copy the CEO photo to the public folder
cp /path/to/ken-west-photo.jpg public/ken-west-ceo.png

# Or from Android Downloads in Termux:
cp /sdcard/Download/ken-west-photo.png public/ken-west-ceo.png
```

The photo is referenced in:
- `src/components/ui/CEOCard.tsx` (Home page)
- `src/app/about/page.tsx` (About page)

---

## 🗄️ DATABASE STRUCTURE

### Firestore Collections:
```
users/
  {uid}: { uid, displayName, email, phone, role, createdAt }

products/
  {id}: { name, description, price, category, thumbnailUrl,
          downloadUrl, isLocked, unlockedFor, likesCount, ... }

orders/
  {id}: { orderNumber, userId, userName, serviceName, amount,
          status, description, deadline, createdAt }

payments/
  {id}: { orderId, userId, amount, method, proofUrl,
          status, approvedAt }

messages/
  {conversationId}/chats/{messageId}: { senderId, text, createdAt }

conversations/
  {id}: { participants, lastMessage, unreadCount }

notifications/
  {id}: { userId, type, title, message, read, createdAt }

likes/
  {productId_userId}: { productId, userId, createdAt }

comments/
  {id}: { productId, userId, text, createdAt }

admin_logs/
  {id}: { action, adminId, details, timestamp }

ai_generations/
  {id}: { adminId, tool, prompt, result, createdAt }
```

---

## 🔒 SECURITY SUMMARY

1. **Firebase Rules** — `firestore.rules` restricts access by role
2. **Admin Routes** — `/admin` checks `user.role === 'admin'` client-side
3. **AI Tools** — Only accessible from admin panel, API validates `adminId`
4. **Downloads** — Locked via `isLocked` + `unlockedFor` fields; only released after admin approval
5. **Watermarks** — CSS-based on all preview images
6. **Environment Variables** — All secrets in `.env.local`, never committed to git
7. **Storage Rules** — File type + size validation enforced

---

## 📈 FUTURE SCALING

1. **Payment APIs** — Replace manual proof with Airtel/MTN/Flutterwave APIs
2. **Email Notifications** — Add SendGrid/Resend for order confirmations
3. **CDN** — Move assets to Cloudinary for optimized image delivery
4. **PWA** — Add service worker for offline support (key for Zambia)
5. **Analytics** — Firebase Analytics + Google Analytics
6. **Search** — Add Algolia for product search
7. **Subscriptions** — Monthly social media management billing
8. **App** — React Native mobile app using same Firebase backend

---

## 💡 QUICK COMMANDS REFERENCE

```bash
# Start dev server
npm run dev

# Build for production  
npm run build

# Start production server
npm start

# Deploy to Vercel
vercel --prod

# Push to GitHub
git add . && git commit -m "update" && git push

# Update Firebase rules
firebase deploy --only firestore:rules,storage
```

---

Built with ❤️ for Ken Media Creative Studio · Lusaka, Zambia 🇿🇲
