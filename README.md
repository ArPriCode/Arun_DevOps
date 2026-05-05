# Cinemora — Web Series Review Platform

A full-stack web application for discovering, reviewing, and tracking web series. Built with React + Node.js/Express + MySQL, deployed using a complete DevOps pipeline.

---

## Architecture

```
Frontend (React + Vite)  →  Backend (Node.js + Express)  →  Database (MySQL + Prisma)
        ↓                           ↓
   GitHub Actions CI/CD        AWS EKS (Kubernetes)
        ↓
   Terraform (IaC)  →  AWS (S3 + ECR + EKS)
```

---

## DevOps Pipeline

### GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | push/PR to main | Backend tests, frontend tests, E2E (Cypress) |
| `pr-checks.yml` | Every PR | ESLint + Prettier format check |
| `pipeline.yml` | push to main | Full 4-phase CI/CD pipeline |
| `deploy-ec2.yml` | Manual | Deploy to EC2 via SSH |
| `dependabot.yml` | Weekly | Auto-update npm + GitHub Actions dependencies |

### CI/CD Pipeline — 4 Phases

```
Push to main
     ↓
Phase 1 — Testing
  ├── Jest unit tests (backend)
  ├── Integration tests (API + in-memory DB)
  └── Coverage report artifact

     ↓
Phase 2 — Terraform Infrastructure
  ├── terraform init
  ├── terraform validate
  ├── terraform plan
  └── terraform apply
       ├── S3 bucket (versioning + AES256 encryption + public access blocked)
       ├── ECR repository (Docker image registry)
       └── EKS cluster + node group (2 nodes)

     ↓
Phase 3 — Container Build
  ├── Docker multi-stage build
  ├── Push to Amazon ECR
  └── Tagged with git SHA

     ↓
Phase 4 — Kubernetes Deployment
  ├── aws eks update-kubeconfig
  ├── kubectl apply namespace/deployment/service
  └── kubectl rollout status (verify)
```

---

## Infrastructure (Terraform)

All infrastructure is defined as code in `terraform/`:

| Resource | Config |
|----------|--------|
| **S3 Bucket** | Versioning enabled, AES256 encryption, public access blocked |
| **ECR Repository** | Image scanning on push, mutable tags |
| **EKS Cluster** | `cinemora-eks-cluster`, us-east-1 |
| **EKS Node Group** | 2 nodes, `t3.small`, auto-scaling (1-3) |

---

## Kubernetes (k8s/)

```
k8s/
├── namespace.yaml     # cinemora namespace
├── deployment.yaml    # 2 replicas, resource limits, liveness + readiness probes
└── service.yaml       # LoadBalancer on port 80 → 5001
```

### Deployment specs:
- **Replicas:** 2 minimum
- **Resource limits:** 200m CPU, 256Mi memory
- **Liveness probe:** GET /health every 10s
- **Readiness probe:** GET /health every 5s
- **Non-root user:** UID 1001
- **Namespace:** `cinemora` (non-default)

---

## Docker

### Dockerfile (multi-stage)

```
Stage 1 (builder)   →  Install deps + generate Prisma client
Stage 2 (production) →  Production deps only + non-root user + healthcheck
```

### Docker Compose (local dev)

```bash
docker-compose up
```

Starts:
- `backend` on port 5001
- `db` (MySQL 8) on port 3306

---

## Testing

| Type | Tool | Location |
|------|------|----------|
| Unit | Jest | `backend/tests/auth.middleware.test.js` |
| Integration | Jest + Supertest | `backend/tests/auth.test.js`, `reviews.test.js` |
| Frontend Unit | Vitest + RTL | `frontend/src/components/SeriesCard/SeriesCard.test.jsx` |
| E2E | Cypress | `frontend/cypress/e2e/basic-flow.cy.js` |

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# E2E tests
cd frontend && npm run test:e2e
```

---

## PR Checks (Linting)

Every pull request automatically runs:
- **ESLint** — backend (CommonJS) + frontend (React/JSX)
- **Prettier** — format check on all files

PR fails if any lint or format issue is found.

---

## Dependabot

Auto-updates configured weekly for:
- `backend/` npm dependencies
- `frontend/` npm dependencies
- `.github/workflows/` GitHub Actions versions

---

## GitHub Secrets Required

| Secret | Purpose |
|--------|---------|
| `AWS_ACCESS_KEY_ID` | AWS authentication |
| `AWS_SECRET_ACCESS_KEY` | AWS authentication |
| `AWS_SESSION_TOKEN` | AWS Academy session |
| `AWS_REGION` | AWS region (us-east-1) |
| `EC2_HOST` | EC2 public IP |
| `EC2_USER` | EC2 SSH user (ubuntu) |
| `EC2_SSH_KEY_B64` | Base64 encoded .pem key |

---

## Idempotent Scripts

```bash
# Backend setup (safe to run multiple times)
bash backend/scripts/setup.sh

# Frontend setup (safe to run multiple times)
bash frontend/scripts/setup.sh
```

Both scripts use:
- `npm ci` (reproducible installs)
- `prisma migrate deploy` (skips applied migrations)
- `pm2 startOrReload` (start or reload, never duplicate)
- `mkdir -p` (no error if exists)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6, Axios |
| Backend | Node.js, Express 5, Prisma ORM |
| Database | MySQL 8 |
| Auth | JWT (jsonwebtoken) |
| Testing | Jest, Vitest, Cypress, Supertest |
| IaC | Terraform |
| Container | Docker (multi-stage), Docker Compose |
| Orchestration | Kubernetes (EKS) |
| CI/CD | GitHub Actions |
| Registry | Amazon ECR |
| Storage | Amazon S3 |


# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

