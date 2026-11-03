# NexDrop Merchant Dashboard & Theme Platform (Vercel Ready)

Next.js 15, Prisma ORM, Tailwind CSS, `@nexdrop/theme-sdk`, and the Universal React + Vite Storefront Engine.

---

## ⚡ 1-Click Deploy to Vercel

This repository is structured for zero-configuration Vercel deployment:
- `package.json` and `vercel.json` are at the **root level**.
- Automatic Next.js framework detection.
- Pre-configured `vercel-build` command with Prisma client generation.

### Deploy Steps

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of NexDrop Merchant Dashboard"
   git branch -M main
   git remote add origin https://github.com/your-username/nexdrop.git
   git push -u origin main
   ```

2. **Import into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your repository
   - Leave **Root Directory** as `./` (default)
   - Under **Storage / Integrations**, connect **Supabase** (or set `DATABASE_URL` in Environment Variables)
   - Set `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
   - Click **Deploy**!

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env

# 3. Setup database
npx prisma migrate dev --name init
npm run db:seed

# 4. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎨 Standalone Offline Dashboard & Theme Editor

The complete, zero-dependency interactive dashboard preview is available at:
- **`public/preview/nexdrop-admin.html`** (served on Vercel at `/preview/nexdrop-admin.html` or openable directly in any browser offline)

Includes:
- Merchant Dashboard (Overview, Orders, Products, Customers, Themes, Settings)
- Inlined pure-JS unzipper (`pako`) with desktop `.zip` file uploader
- Universal React + Vite Storefront Engine
- 3-tab live Visual Editor (`Sections`, `Collections`, and `Files`)
- Pre-loaded themes: **Verdantra Climate Template** & **Timberline Homes**

---

## 📦 Sample Themes

Pre-packaged React + Vite theme archives are located in `sample-themes/`:
- `sample-themes/verdantra-template.zip`
- `sample-themes/timberline.zip`
