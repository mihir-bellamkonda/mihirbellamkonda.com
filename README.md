# Mihir's Poetry Website

A minimalist, book-inspired static website for showcasing poetry. Built with vanilla HTML, CSS, and JavaScript for simplicity and easy maintenance.

## 🎨 Features

- **Mobile-first design** with elegant desktop layout
- **Book-aesthetic styling** with serif fonts and cream paper texture
- **Table of contents** style poem listing
- **Individual poem pages** with swipe navigation (mobile) and arrow keys (desktop)
- **Automatic deployment** via GitHub Actions
- **Easy content updates** - just add markdown files!

## 📁 Project Structure
```
mihir-poetry-site/
├── poems/                   # Add your poem markdown files here
│   ├── 01-morning-light.md
│   ├── 02-after-rain.md
│   └── 03-elegy-for-small-things.md
├── templates/               # HTML templates (rarely need to edit)
│   ├── layout.html
│   ├── about.html
│   ├── poems-list.html
│   └── poem.html
├── styles/                  # CSS files (edit to change styling)
│   ├── main.css            # Main styles and CSS variables
│   ├── about.css           # About page styles
│   ├── poems.css           # Poems list styles
│   └── poem.css            # Individual poem styles
├── scripts/                 # JavaScript files
│   └── poem-navigation.js  # Swipe and keyboard navigation
├── public/                  # Static assets
│   └── images/
│       └── profile.jpg     # Your profile photo
├── build.js                 # Build script (reads poems, generates HTML)
├── package.json             # Dependencies
└── README.md               # This file!
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
   - Replace `public/images/profile.jpg` with your photo
   - Recommended size: 400x400px or larger
   - Will be displayed as a circle

5. **Update your information**
   - Edit `templates/about.html` with your:
     - Name
     - Pronouns
     - Email address

## ✍️ Adding/Updating Poems

### To Add a New Poem:

1. Create a new `.md` file in the `poems/` folder
   - Name it with a number prefix for ordering: `04-my-new-poem.md`
   - Poems are displayed in alphabetical order by filename

2. Add front matter at the top (between `---` lines):
```markdown
   ---
   title: "Your Poem Title"
   date: 2024-10-27
   published_in: "Magazine Name"        # Optional
   external_url: "https://example.com"  # Optional
   ---
```

3. Write your poem below the front matter:
```markdown
   Your poem text here
       You can indent lines
           for visual structure
   
   Use blank lines for stanzas
   
   Use *asterisks* for *italics*
   Use **double asterisks** for **bold**
```

4. Save the file, commit, and push to GitHub
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

Edit `styles/main.css` and update the CSS variables at the top:
```css
:root {
  --color-background: #F9F7F4;  /* Cream background */
  --color-text: #2C2C2C;         /* Dark text */
  --color-accent: #1B4332;       /* Dark green for links */
  /* ... more variables ... */
}
```

### Changing Fonts:

In `styles/main.css`, uncomment your preferred font:
```css
/* Current font (Libre Baskerville) */
--font-heading: 'Libre Baskerville', serif;

/* To switch to Crimson Text, comment out above and uncomment below: */
/* --font-heading: 'Crimson Text', serif; */
```

### Removing Paper Texture:

In `styles/main.css`, find the `body` section and comment out these lines:
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
# Build the site
npm run build

# Serve it locally (opens at http://localhost:3000)
npm run dev
```

The built site will be in the `dist/` folder.

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

2. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Click "Settings" → "Pages"
   - Under "Source", select "Deploy from a branch"
   - Select branch: `gh-pages`
   - Click "Save"

3. **Wait for deployment**
   - GitHub Actions will automatically build and deploy your site
   - Check the "Actions" tab to see progress
   - Site will be live at: `https://YOUR-USERNAME.github.io/YOUR-REPO/`

### After Setup:

Every time you push changes to the `main` branch, GitHub Actions will automatically:
1. Build your site
2. Deploy to GitHub Pages
3. Make it live in 2-3 minutes

## 🔧 How the Build Process Works

The `build.js` script is well-commented and does the following:

1. **Reads all `.md` files** from the `poems/` folder
2. **Parses front matter** (title, date, etc.) from each poem
3. **Converts markdown to HTML** using the `marked` library
4. **Generates HTML pages** by injecting content into templates
5. **Copies styles and assets** to the `dist/` folder
6. **Creates navigation** between poems (prev/next links)

You can open `build.js` and read through it - it's written to be understandable!

## 📱 Navigation Features

### On Mobile:
- **Swipe left** to go to next poem
- **Swipe right** to go to previous poem
- Tap the arrows to navigate

### On Desktop:
- **Arrow keys** (← →) to navigate between poems
- Click the arrows
- Shows "Poem X of Y" at the bottom

## 🐛 Troubleshooting

### "Site not updating after push"
- Check the "Actions" tab on GitHub for build errors
- Make sure you're pushing to the `main` branch
- Wait 2-3 minutes for deployment to complete

### "Images not showing"
- Make sure images are in `public/images/`
- Check that file names match exactly (case-sensitive!)
- Run `npm run build` to rebuild

### "Poems not appearing"
- Make sure poem files end in `.md`
- Check that front matter is properly formatted (between `---` lines)
- Front matter must have at least a `title` field

### "Build errors"
- Run `npm install` to make sure dependencies are installed
- Check that Node.js version is 18 or higher: `node --version`

## 📝 Notes

- The site is completely static - no database, no server needed
- Everything runs from GitHub Pages for free
- Poems are sorted alphabetically by filename (use number prefixes to control order)
- The design is intentionally minimal to let the poetry speak for itself

## 🤝 Need Help?

If you need help making changes, reach out to Mac! The code is intentionally simple and well-commented so you can learn how it works.

---

**Happy writing! 📖✨**