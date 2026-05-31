# 💸 SpendSmart — Daily Expense Tracker

A beautiful, fully-featured **daily expense tracker** built with pure HTML, CSS & JavaScript.  
Zero dependencies to install — just open `index.html` in a browser!

---

## 🚀 Features

| Feature | Details |
|---|---|
| 👤 **Per-Person Tracking** | Add multiple people, each with a unique avatar color |
| 🏷️ **12 Spending Categories** | Food, Transport, Groceries, Health, Shopping & more |
| 📅 **Date Tracking** | Log any past or present date |
| 📊 **Bar & Doughnut Charts** | Category, Person, Daily Trend, Weekly, Heatmap (Chart.js) |
| 🔍 **Search & Filters** | Filter by person, category, sort by date/amount |
| 📤 **CSV Export** | One-click export of all expenses |
| 💾 **localStorage** | Data persists in the browser — no server needed |
| 📱 **Fully Responsive** | Works on mobile, tablet & desktop |
| 🌙 **Dark Theme** | Sleek modern dark UI |

---

## 🎯 Suggested Improvements (Future Scope)

1. **Monthly Budget Limits** — Set a cap per category and get alerts when exceeded  
2. **Recurring Expenses** — Auto-log monthly bills (rent, subscriptions)  
3. **Split Bill Calculator** — Divide expenses among people fairly  
4. **Multi-currency Support** — Switch between ₹, $, €, £  
5. **PWA (Offline App)** — Install on mobile home screen with Service Worker  
6. **Cloud Sync** — Firebase or Supabase backend for cross-device access  
7. **Notifications** — Daily/weekly spending summaries via browser notifications  
8. **Income Tracking** — Add income entries and show net savings  
9. **Tags / Custom Categories** — Let users create their own categories  
10. **Dark/Light Mode Toggle** — Theme switcher  

---

## 🌐 Deployment Platforms

Since this is a **static site** (HTML + CSS + JS only), you can deploy for **FREE** on:

### ⭐ Recommended: **Netlify** (easiest)
```
1. Go to https://netlify.com → Sign up free
2. Drag & drop your project folder onto the Netlify dashboard
3. Done! You get a live URL in seconds.
```

### **Vercel**
```
1. Go to https://vercel.com → Sign up free
2. Import from GitHub or drag & drop
3. Live URL in ~30 seconds
```

### **GitHub Pages**
```
1. Push code to a GitHub repo
2. Repo → Settings → Pages → Source: main branch
3. Live at https://<username>.github.io/<repo-name>
```

### **Cloudflare Pages**
```
1. Go to https://pages.cloudflare.com
2. Connect GitHub repo or upload directly
3. Free, fast global CDN
```

### **Surge.sh** (CLI)
```bash
npm install -g surge
cd "Expense tracker"
surge
```

---

## 📂 File Structure

```
Expense tracker/
├── index.html   ← Main app shell
├── style.css    ← All styles (dark theme, responsive)
├── app.js       ← All logic (charts, CRUD, filters, export)
└── README.md    ← This file
```

---

## 🔧 Running Locally

Simply open `index.html` in any modern browser — **no build step needed!**

Or use VS Code Live Server:
```
Right-click index.html → Open with Live Server
```

---

*Built with ❤️ using Chart.js, Font Awesome & Google Fonts*
