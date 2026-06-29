# 🚀 Azonnox Unified Live Deployment Guide (Single Project + Dokploy)

This guide walks you through deploying your **single unified platform** (API, Admin Panel, and Storefront) live onto your VPS using **Dokploy** on **1 single domain**, while keeping your database on **MongoDB Atlas**.

---

## 🌐 Unified Architecture

| URL Route | Served Component | Description |
|---|---|---|
| `https://yourdomain.com/` | Storefront Theme | Angular SSR (Server-Side Rendered) storefront |
| `https://yourdomain.com/admin` | Admin Panel | Angular SPA Dashboard |
| `https://yourdomain.com/api` | API Backend | NestJS REST API |

Everything runs in **1 container, 1 process, 1 domain**. No subdomains or CORS issues required!

---

## 💾 Part 1: Database & Backups Q&A

### 1. Where is my database?
Your database is hosted in the cloud on **MongoDB Atlas** (using the connection string: `mongodb+srv://arifurfullstack_db_user:...`). 
* When you deploy the unified app to your live VPS, it will connect to this cloud database over the internet.
* **This is ideal**: If your VPS crashes or restarts, your database remains safe and unaffected on MongoDB Atlas.

---

## 🛠️ Part 2: Step-by-Step Dokploy Deployment

### Step 1: Push Your Code to GitHub
Ensure all your modifications are pushed to your GitHub repository.

### Step 2: Set Up DNS Records
Point your single domain to your VPS IP address. In your domain registrar (Cloudflare, Namecheap, GoDaddy, etc.), add the following **A record**:
* `yourdomain.com` ➔ `VPS_IP_ADDRESS`
* `www.yourdomain.com` ➔ `VPS_IP_ADDRESS` (optional)

---

### Step 3: Deploy the Unified Application on Dokploy
1. Log in to your **Dokploy Dashboard** (usually at `http://your-vps-ip:3000`).
2. Create a new **Project** (e.g., `Azonnox`).
3. Click **Add Application**:
   * **Name**: `azonnox-unified`
   * **Repository**: Select your GitHub repository.
   * **Branch**: `main` or `master`
   * **Root Directory**: `/` (or leave empty for project root)
   * **Build Type**: `Dockerfile` (Dokploy will automatically use the root `Dockerfile`).
4. Go to the **Environment** tab and add your environment variables:
   * `PORT=4220`
   * `INTERNAL_API_PORT=3000`
   * `MONGODB_URI=mongodb+srv://arifurfullstack_db_user:NoiRbJnmdOf2CoCG@clusterx.ewqe3mi.mongodb.net/azonnox_db?retryWrites=true&w=majority`
   * `JWT_PRIVATE_KEY_USER=your_secure_random_key_1`
   * `JWT_PRIVATE_KEY_ADMIN=your_secure_random_key_2`
   * `JWT_PRIVATE_KEY_VENDOR=your_secure_random_key_3`
   * `JWT_PRIVATE_KEY_AFFILIATE=your_secure_random_key_4`
   * `JWT_PRIVATE_KEY_VENDOR_SECRET=your_secure_random_key_5`
   * `PRODUCTION_BUILD=true`
5. Go to the **Domains** tab:
   * Add your main domain: `yourdomain.com` (and `www.yourdomain.com` if using).
   * Set Container Port to `4220`.
   * Enable **HTTPS / SSL** (Dokploy handles automatic Let's Encrypt SSL certificates!).
6. Click **Deploy**.

---

## 🎉 Done!
Dokploy will monitor your GitHub repository. Whenever you push code to GitHub, Dokploy will automatically build the unified container and deploy your live website!
