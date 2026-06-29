# 🛍️ Azonnox Unified E-Commerce Platform (`azonno-angular-baba-ecom-bd`)

An enterprise-grade, single-domain, unified e-commerce platform built with **Angular (SSR & SPA)** and **NestJS (REST API Backend)**. Designed for seamless execution in a unified container architecture with single-domain routing and zero CORS configuration overhead.

---

## 🌐 Unified Architecture

The application is structured as a unified monorepo running on a single port & single domain, proxying traffic internally to their respective services:

| Route | Served Component | Technology Stack | Description |
|---|---|---|---|
| `https://yourdomain.com/` | **Storefront Theme** | Angular (SSR) | Dynamic, SEO-optimized customer-facing store |
| `https://yourdomain.com/admin` | **Admin Dashboard** | Angular (SPA) | Comprehensive administration control panel |
| `https://yourdomain.com/api` | **REST API Backend** | NestJS & MongoDB | Scalable microservice backend & data storage |

---

## ✨ Key Features

- **⚡ Server-Side Rendering (SSR)**: High-performance, SEO-ready Storefront powered by Angular Engine.
- **📊 Comprehensive Admin Panel**: Manage products, categories, orders, customers, expense tracking, and shop settings.
- **🔐 Multi-Role Authentication**: JWT-based security supporting User, Vendor, Admin, and Affiliate roles.
- **📦 Unified Single-Container Architecture**: Node.js unified runner (`start-unified.js`) proxying internal traffic automatically.
- **☁️ Cloud Database Ready**: Powered by MongoDB Atlas for robust data retention and high availability.
- **🚀 One-Click Live Deployment**: Pre-configured Dockerfile and guides for instant deployment on Dokploy, CapRover, or VPS.

---

## 🛠️ Tech Stack

- **Frontend (Storefront)**: Angular 17+ (SSR / Universal), SCSS, RxJS
- **Frontend (Admin)**: Angular 17+ (SPA), Reactive Forms, Tailwind / Custom UI
- **Backend**: NestJS, TypeScript, Express, Mongoose
- **Database**: MongoDB Atlas
- **DevOps & Tooling**: Docker, Dokploy, Node.js, PowerShell

---

## 🚀 Quick Start & Local Development

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/arifurfullstack/azonno-angular-baba-ecom-bd.git
   cd azonno-angular-baba-ecom-bd
   ```

2. **Install Dependencies**:
   Install root and module dependencies:
   ```bash
   npm install
   cd apix && npm install && cd ..
   cd adminx && npm install && cd ..
   cd themex && npm install && cd ..
   ```

3. **Environment Configuration**:
   Configure `.env` in `apix/` with your database connection string and JWT credentials (see `DEPLOYMENT.md` for variable keys).

4. **Run the Unified Application**:
   ```bash
   npm start
   ```
   *The unified runner will start all services and route traffic on port 4220!*

---

## 🐳 Docker & Live Deployment

For live deployment instructions on VPS using Dokploy, please refer to the detailed guide in [DEPLOYMENT.md](file:///c:/rifxweb/azonnox/xazonnox/DEPLOYMENT.md).

Quick Docker Build:
```bash
docker build -t azonnox-unified .
docker run -p 4220:4220 -e PORT=4220 azonnox-unified
```

---

## 👨‍💻 Developer Profile & Customization Services

> ### Lead Developer: MD Arifur Rahman
> 
> 💬 **WhatsApp**: [+880 1756-601431](https://wa.me/8801756601431)  
> ✉️ **Email**: [arifur.fullstack@gmail.com](mailto:arifur.fullstack@gmail.com)  
> 🛠️ **Notice**: For any additional custom integrations or platform tailoring, feel free to send a DM!

---

## 📄 License

This project is proprietary and confidential. All rights reserved by the lead developer.
