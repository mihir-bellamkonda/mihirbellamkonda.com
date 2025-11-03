# Mihir's Poetry Website

A minimalist, book-inspired poetry website built with Vue 3. Features an elegant card-stack interface with swipe navigation for a delightful reading experience on both mobile and desktop.

## 🎨 Features

- **Mobile-first design** with elegant desktop layout
- **Card-stack interface** - swipe through poems like turning pages
- **Book-aesthetic styling** with serif fonts and cream paper texture
- **Table of contents** style poem listing
- **Swipe navigation** (mobile), click navigation, and arrow keys (desktop)
- **Automatic deployment** via GitHub Pages
- **Easy content updates** - just add markdown files!
- **Responsive font scaling** - poems adjust to fit your screen

## 📁 Project Structure

```
mihirbellamkonda.com/
├── src/                        # Vue application source
│   ├── main.js                 # App entry point
│   ├── App.vue                 # Main app with routing & navigation
│   ├── style.css               # Global styles with CSS variables
│   ├── poems.json              # AUTO-GENERATED - don't edit!
│   └── components/
│       ├── AboutPage.vue       # Landing page
│       ├── PoemsListPage.vue   # Table of contents
│       └── PoemPage.vue        # Individual poem display
├── poems/                      # Add your poem markdown files here
│   ├── 01-The Gesture.md
│   ├── 02-Summer.md
│   └── 03-Thuragnosia.md
├── scripts/
│   └── build-poems.js          # Converts markdown → JSON
├── public/
│   └── images/
│       └── mihir.jpg           # Profile photo
├── dist/                       # AUTO-GENERATED build output
├── index.html                  # HTML entry point
├── vite.config.js              # Build configuration
├── package.json                # Dependencies
└── README.md                   # This file!
```

## 🚀 Getting Started

### Initial Setup

1. **Install Node.js** (if not already installed)
   - Download from: https://nodejs.org/
   - Version 18 or higher recommended

2. **Clone this repository** to your computer

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Add your profile photo**
   - Replace `public/images/mihir.jpg` with your photo
   - Recommended size: 400x400px or larger
   - Will be displayed as a circle on the about page

5. **Update your information**
   - Edit `src/components/AboutPage.vue` with your:
     - Name
     - Email address
     - Any other info you want on the landing page

## ✍️ Adding/Updating Poems

### To Add a New Poem:

1. **Create a new `.md` file** in the `poems/` folder
   - Name it with a number prefix for ordering: `04-my-new-poem.md`
   - Poems are displayed in alphabetical order by filename

2. **Add front matter** at the top (between `---` lines):
   ```markdown
   ---
   title: "Your Poem Title"
   date: 2024-10-27
   published_in: "Magazine Name"        # Optional
   external_url: "https://example.com"  # Optional
   ---
   ```

3. **Write your poem** below the front matter:
   ```markdown
   Your poem text here
       You can indent lines
           for visual structure

   Use blank lines for stanzas

   Use *asterisks* for *italics*
   Use **double asterisks** for **bold**
   ```

4. **Build and test locally** (optional):
   ```bash
   npm run dev
   ```
   Opens at http://localhost:5173

5. **Commit and push** to GitHub
   - The site will automatically rebuild and deploy!

### Example Poem File:

```markdown
---
title: "Morning Light"
date: 2024-10-15
published_in: "Poetry Magazine"
external_url: "https://www.poetrymagazine.com/example"
---

The dawn breaks slowly,
    painting the sky
        in shades of amber and rose.

Birds begin their chorus,
    each note a prayer,
        each song a *beginning*.
```

### Formatting Tips:

- **Indentation**: Just use spaces at the start of lines - they'll be preserved!
- **Stanzas**: Use blank lines to separate stanzas
- **Italics**: Wrap text in `*asterisks*` or `_underscores_`
- **Bold**: Wrap text in `**double asterisks**`
- **Line breaks**: Just hit Enter - they're preserved in poems

## 🎨 Customizing the Design

### Changing Colors:

Edit `src/style.css` and update the CSS variables at the top:

```css
:root {
  --color-background: #F9F7F4;  /* Cream background */
  --color-text: #2C2C2C;         /* Dark text */
  --color-accent: #1B4332;       /* Dark green for links */
  /* ... more variables ... */
}
```

### Changing Fonts:

Currently using **Libre Baskerville** (headings) and **Lora** (body text).

To change fonts:
1. Update the Google Fonts link in `index.html` (lines 7-9)
2. Update the CSS variables in `src/style.css`:
   ```css
   --font-heading: 'Libre Baskerville', serif;
   --font-body: 'Lora', serif;
   ```

### Removing Paper Texture:

In `src/style.css`, find the `body` section and comment out these lines:

```css
body {
  /* ... */

  /* Comment out these 2 lines to remove texture: */
  /* background-image: url("data:image/svg+xml..."); */
  /* background-repeat: repeat; */
}
```

## 🏗️ Building Locally

To preview your site before pushing to GitHub:

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### What Each Command Does:

- **`npm run dev`** - Starts local dev server at http://localhost:5173
  - Auto-rebuilds poems when you edit markdown files
  - Hot module reload - see changes instantly!

- **`npm run build`** - Creates production build in `dist/` folder
  - Minifies and optimizes all code
  - Generates `src/poems.json` from markdown files

- **`npm run preview`** - Preview the production build locally

## 🌐 Deploying to GitHub Pages

### One-Time Setup:

1. **Push this repository to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```

2. **Create GitHub Actions workflow**

   Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [ main ]

   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3

         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'

         - name: Install and Build
           run: |
             npm install
             npm run build

         - name: Deploy to GitHub Pages
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

3. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Click "Settings" → "Pages"
   - Under "Source", select "Deploy from a branch"
   - Select branch: `gh-pages`
   - Click "Save"

4. **Configure base path** (if using a project repo)

   If your site will be at `https://username.github.io/repo-name/`, update `vite.config.js`:
   ```javascript
   export default defineConfig({
     base: '/repo-name/',  // Add your repo name
     // ... rest of config
   });
   ```

5. **Wait for deployment**
   - GitHub Actions will automatically build and deploy your site
   - Check the "Actions" tab to see progress
   - Site will be live at: `https://YOUR-USERNAME.github.io/YOUR-REPO/`

### After Setup:

Every time you push changes to the `main` branch, GitHub Actions will automatically:
1. Build your Vue app
2. Generate poems.json from markdown
3. Deploy to GitHub Pages
4. Make it live in 2-3 minutes

## 🔧 How the Build Process Works

### Step 1: Poem Processing (`npm run poems`)

The `scripts/build-poems.js` script:
1. Reads all `.md` files from `poems/` folder
2. Parses front matter (title, date, etc.) from each poem
3. Converts markdown to HTML using the `marked` library
4. Generates `src/poems.json` with all poem data

### Step 2: Vue Build (`npm run build`)

Vite builds the Vue application:
1. Bundles all Vue components
2. Imports `poems.json` into the app
3. Minifies JavaScript and CSS
4. Copies static assets from `public/`
5. Outputs everything to `dist/` folder

The `dist/` folder is what gets deployed to GitHub Pages!

## 📱 Navigation Features

### On Mobile:
- **Swipe left** to go to next page/poem
- **Swipe right** to go to previous page/poem
- **Tap left half** of screen to go back
- **Tap right half** of screen to go forward

### On Desktop:
- **Arrow keys** (← →) to navigate
- **Click left/right halves** of page to navigate
- Shows page number indicator at bottom

### Navigation Flow:
1. **About page** → swipe → **Contents page** → swipe → **First poem**
2. **Any poem** → swipe back → **Contents page** (not previous poem)
3. **Last poem** → swipe forward → **Contents page**

## 🐛 Troubleshooting

### "Site not updating after push"
- Check the "Actions" tab on GitHub for build errors
- Make sure you're pushing to the `main` branch
- Wait 2-3 minutes for deployment to complete
- Hard refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)

### "Images not showing"
- Make sure images are in `public/images/`
- Check that file names match exactly (case-sensitive!)
- Run `npm run build` to rebuild

### "Poems not appearing"
- Make sure poem files end in `.md`
- Check that front matter is properly formatted (between `---` lines)
- Front matter must have at least a `title` field
- Run `npm run poems` to regenerate poems.json

### "Build errors"
- Run `npm install` to make sure dependencies are installed
- Check that Node.js version is 18 or higher: `node --version`
- Delete `node_modules` and `package-lock.json`, then run `npm install`

### "Dev server not starting"
- Check that port 5173 is not already in use
- Try `npm run dev -- --port 3000` to use a different port

## 📝 Technical Notes

- **Vue 3 SPA**: Single Page Application with hash-based routing
- **No router library**: Custom lightweight routing in App.vue
- **Vite bundler**: Fast builds with Hot Module Reload
- **Static output**: Everything compiles to static HTML/CSS/JS
- **No backend needed**: Runs entirely on GitHub Pages
- **poems.json**: Auto-generated, don't edit manually or commit to git
- **dist/**: Auto-generated build output, don't commit to git

## 🤝 Need Help?

If you need help making changes, the code is well-commented and organized:

- **Styling**: Check `src/style.css`
- **Components**: Look in `src/components/`
- **Routing/Navigation**: See `src/App.vue`
- **Build script**: Read `scripts/build-poems.js`

For more technical details, see `CLAUDE.md`.

---

**Happy writing! 📖✨**
