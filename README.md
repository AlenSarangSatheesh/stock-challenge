# 📈 Stock Challenge

A weekly stock prediction game where participants choose stocks and compete based on performance.

## 🎯 Features

- 📊 Real-time leaderboard with live updates
- 🔥 Firebase Firestore backend
- 🔒 Secure credential management via GitHub Secrets
- 📱 Fully responsive design (mobile & desktop)
- ⚡ Fast and lightweight (vanilla JavaScript)
- 🎨 Modern, beautiful UI with gradient backgrounds

## 🚀 Live Demo

Visit: `https://YOUR_USERNAME.github.io/stock-challenge/`

## 📋 How It Works

1. **Join**: Enter your name and pick a stock symbol (NSE/BSE)
2. **Compete**: Your stock's performance is tracked from Friday's closing price
3. **Win**: Highest percentage gain by Sunday 12:00 AM wins!
4. **Deadline**: Entries close every Sunday at midnight

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Firebase Firestore
- **Hosting**: GitHub Pages
- **CI/CD**: GitHub Actions

## 📦 Project Structure

```
stock-challenge/
├── index.html              # Main HTML
├── css/
│   └── styles.css         # All styles
├── js/
│   ├── config.js          # Firebase config (placeholders)
│   ├── firebase-service.js # Firebase operations
│   ├── ui-manager.js      # UI rendering
│   └── app.js             # Main app logic
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions deployment
├── firestore.rules        # Firestore security rules
├── firestore.indexes.json # Firestore indexes
├── firebase.json          # Firebase config
├── .gitignore
└── README.md
```

## 🔧 Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `stock-challenge`
4. Disable Google Analytics (optional)
5. Click "Create Project"

### Step 2: Enable Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click "Create Database"
3. Choose **Start in production mode** (we'll add rules later)
4. Select location: `asia-south1` (Mumbai) or closest to you
5. Click "Enable"

### Step 3: Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click web icon (`</>`) to add a web app
4. Register app name: `Stock Challenge Web`
5. **Copy the config values** - you'll need these:
   ```javascript
   apiKey: "AIza..."
   authDomain: "stock-challenge-xxxxx.firebaseapp.com"
   projectId: "stock-challenge-xxxxx"
   storageBucket: "stock-challenge-xxxxx.appspot.com"
   messagingSenderId: "123456789"
   appId: "1:123456789:web:xxxxx"
   ```

### Step 4: Deploy Firestore Rules

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   cd stock-challenge
   firebase init firestore
   ```
   - Select your project
   - Use `firestore.rules` for rules file
   - Use `firestore.indexes.json` for indexes

4. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only firestore:indexes
   ```

### Step 5: Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Repository name: `stock-challenge`
3. Description: "Weekly stock challenge game"
4. **Public** repository (required for GitHub Pages)
5. Click "Create repository"

### Step 6: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add each of these:

   | Secret Name | Value |
   |------------|-------|
   | `FIREBASE_API_KEY` | Your `apiKey` value |
   | `FIREBASE_AUTH_DOMAIN` | Your `authDomain` value |
   | `FIREBASE_PROJECT_ID` | Your `projectId` value |
   | `FIREBASE_STORAGE_BUCKET` | Your `storageBucket` value |
   | `FIREBASE_MESSAGING_SENDER_ID` | Your `messagingSenderId` value |
   | `FIREBASE_APP_ID` | Your `appId` value |

### Step 7: Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Source: **GitHub Actions**
3. Save

### Step 8: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Stock Challenge app"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/stock-challenge.git

# Push to main
git branch -M main
git push -u origin main
```

### Step 9: Deployment

GitHub Actions will automatically:
1. Inject Firebase credentials from secrets
2. Build the site
3. Deploy to GitHub Pages

Wait 2-3 minutes, then visit:
`https://YOUR_USERNAME.github.io/stock-challenge/`

## 🔒 Security Features

- ✅ Firebase credentials stored in GitHub Secrets (never in code)
- ✅ Credentials injected during deployment only
- ✅ Firestore security rules protect database
- ✅ No sensitive data in public repository

## 🧪 Local Development

For local testing with Firebase:

1. Create `js/config.local.js`:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_ACTUAL_API_KEY",
     authDomain: "YOUR_ACTUAL_AUTH_DOMAIN",
     // ... other config values
   };
   ```

2. Modify `index.html` to load `config.local.js` instead:
   ```html
   <script src="js/config.local.js"></script>
   ```

3. Open `index.html` in browser

**Note**: `config.local.js` is gitignored and won't be committed.

## 📝 Customization

### Change Stock Exchanges

Edit `index.html`, line ~90:
```html
<select id="exchange" name="exchange">
  <option value="NYSE">NYSE</option>
  <option value="NASDAQ">NASDAQ</option>
</select>
```

### Change Deadline

Edit `js/config.js`:
```javascript
const APP_CONFIG = {
  deadlineDay: 0,    // 0 = Sunday, 1 = Monday, etc.
  deadlineHour: 0,   // 0-23
  deadlineMinute: 0  // 0-59
};
```

### Use Real Stock API

Replace `fetchStockPrice()` in `js/app.js`:
```javascript
async function fetchStockPrice(symbol, exchange) {
  const response = await fetch(
    `https://api.example.com/stock/${symbol}?exchange=${exchange}`
  );
  const data = await response.json();
  return data.price;
}
```

### API Suggestions:
- [Alpha Vantage](https://www.alphavantage.co/)
- [Yahoo Finance API](https://www.yahoofinanceapi.com/)
- [NSE India](https://www.nseindia.com/)

## 🐛 Troubleshooting

### Firebase not connecting
- Check if all GitHub Secrets are set correctly
- Verify Firebase project is active
- Check browser console for errors

### Deployment failed
- Ensure GitHub Actions has permissions
- Check if all secret names match exactly
- Review GitHub Actions logs

### Data not updating
- Check Firestore security rules are deployed
- Verify network tab for API calls
- Check Firebase Console for data

## 📄 License

MIT License - Feel free to use for your projects!

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Open Pull Request

## 📧 Support

For issues, please open a [GitHub Issue](https://github.com/YOUR_USERNAME/stock-challenge/issues)

---

Made with ❤️ for stock market enthusiasts