
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- Configuration ---
const TARGET_PROJECT_COUNT = 1000;
const BATCH_SIZE = 50;

// --- Data Types ---

type SnippetTemplate = {
    title: string;
    language: string;
    extension: string;
    content: string;
};

type ProjectArchetype = {
    category: string;
    descriptionTemplates: string[];
    tasks: string[];
    docs: string[];
    snippets: SnippetTemplate[];
    titleGenerators: {
        adjectives: string[];
        techs: string[];
        types: string[];
    };
};

// --- Content Pools ---

const COMMON_TASKS = [
    "Update README with latest instructions", "Fix typos in documentation",
    "Bump dependency versions", "Refactor messy code in utils",
    "Add more unit tests", "Setup prettier configuration",
    "Review pull requests", "Update license file"
];

const ARCHETYPES: ProjectArchetype[] = [
    {
        category: "Frontend",
        titleGenerators: {
            adjectives: ["Modern", "Responsive", "Accessible", "Lightweight", "Interactive", "Legacy", "Experimental", "Corporate"],
            techs: ["React", "Vue", "Svelte", "Next.js", "Tailwind", "Bootstrap", "WebAssembly", "PWA"],
            types: ["Dashboard", "Landing Page", "Admin Panel", "Portfolio", "Design System", "Component Library", "Storefront", "Blog"]
        },
        descriptionTemplates: [
            "A high-performance frontend application built for scalability.",
            "User-centric interface designed with accessibility in mind.",
            "Modern web experience leveraging the latest browser APIs.",
            "Internal tool for managing business operations efficiently."
        ],
        tasks: [
            ...COMMON_TASKS,
            "Implement Dark Mode toggle", "Fix responsive layout on mobile", "Optimize image loading with lazy load",
            "Integrate Stripe payment gateway", "Refactor Context API to Redux", "Add unit tests for Button component",
            "Update dependencies to latest React", "Accessibility audit (WCAG 2.1)", "Setup Storybook",
            "Migrate from CSS modules to Tailwind", "Implement infinite scroll", "Add form validation with Zod",
            "Setup Google Analytics", "Optimize bundle size with code splitting", "Fix hydration mismatch errors",
            "Implement drag and drop features", "Add skeleton loading states", "Configure ESLint rules for React",
            "Update meta tags for SEO", "Implement service worker for offline mode"
        ],
        docs: [
            "Component API Reference", "State Management Guide", "Deployment Pipeline", "Design Tokens",
            "Style Guide", "Routing Architecture", "Performance Optimization"
        ],
        snippets: [
            {
                title: "Button", language: "typescript", extension: "tsx",
                content: `import React from 'react';\n\nexport const Button = ({ children, onClick }) => (\n  <button onClick={onClick} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition">\n    {children}\n  </button>\n);`
            },
            {
                title: "useAuth", language: "typescript", extension: "ts",
                content: `import { useState, useEffect } from 'react';\n\nexport function useAuth() {\n  const [user, setUser] = useState(null);\n  // Auth logic here\n  return { user, isLoading: !user };\n}`
            },
            {
                title: "global", language: "css", extension: "css",
                content: `body {\n  margin: 0;\n  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n  -webkit-font-smoothing: antialiased;\n}`
            },
            {
                title: "next.config", language: "javascript", extension: "js",
                content: `/** @type {import('next').NextConfig} */\nconst nextConfig = {\n  reactStrictMode: true,\n  images: {\n    domains: ['example.com'],\n  },\n}\n\nmodule.exports = nextConfig`
            },
            {
                title: "tailwind.config", language: "javascript", extension: "js",
                content: `module.exports = {\n  content: ["./src/**/*.{js,jsx,ts,tsx}"],\n  theme: {\n    extend: { colors: { primary: '#0f172a' } },\n  },\n  plugins: [],\n}`
            }
        ]
    },
    {
        category: "Backend",
        titleGenerators: {
            adjectives: ["Scalable", "Distributed", "Secure", "Real-time", "Serverless", "Monolithic", "Microservice", "Async"],
            techs: ["Node.js", "Go", "Python", "GraphQL", "Redis", "Kafka", "PostgreSQL", "gRPC"],
            types: ["API Gateway", "Auth Service", "Payment Processor", "Indexer", "Task Queue", "Websocket Server", "Data Aggregator", "CRUD API"]
        },
        descriptionTemplates: [
            "Robust backend service handling millions of requests.",
            "Microservice architecture designed for high availability.",
            "Secure API gateway protecting internal resources.",
            "Data processing pipeline for real-time analytics."
        ],
        tasks: [
            ...COMMON_TASKS,
            "Optimize SQL query performance", "Implement JWT authentication", "Add rate limiting middleware",
            "Setup CI/CD pipeline for Docker build", "Migrate database schema", "Write integration tests for payment flow",
            "Refactor error handling logic", "Update API documentation (Swagger)", "Implement caching with Redis",
            "Secure endpoints with Helmet", "Add logging with Winston", "Optimize Docker image size",
            "Implement health check endpoint", "Setup database connection pooling", "Handle graceful shutdown",
            "Implement role-based access control", "Add request validation with Joi", "Setup structured logging",
            "Migrate from REST to GraphQL", "Implement webhook listener"
        ],
        docs: [
            "API Endpoints", "Database Schema", "Authentication Flow", "Disaster Recovery Plan",
            "Environment Variables", "Deployment Limits", "Error Codes Reference"
        ],
        snippets: [
            {
                title: "server", language: "typescript", extension: "ts",
                content: `import express from 'express';\nconst app = express();\n\napp.use(express.json());\n\napp.get('/health', (req, res) => res.json({ status: 'ok' }));\n\napp.listen(3000, () => console.log('Server started'));`
            },
            {
                title: "auth.middleware", language: "typescript", extension: "ts",
                content: `export const authenticate = (req, res, next) => {\n  const token = req.headers.authorization;\n  if (!token) return res.status(401).json({ error: 'Unauthorized' });\n  next();\n};`
            },
            {
                title: "user.model", language: "typescript", extension: "ts",
                content: `import { Schema, model } from 'mongoose';\n\nconst UserSchema = new Schema({\n  email: { type: String, required: true, unique: true },\n  passwordHash: String\n});\n\nexport const User = model('User', UserSchema);`
            },
            {
                title: "db", language: "typescript", extension: "ts",
                content: `import { Pool } from 'pg';\n\nconst pool = new Pool({\n  connectionString: process.env.DATABASE_URL,\n});\n\nexport const query = (text, params) => pool.query(text, params);`
            },
            {
                title: "docker-compose", language: "yaml", extension: "yml",
                content: `version: "3.8"\nservices:\n  api:\n    build: .\n    ports:\n      - "3000:3000"\n    environment:\n      - NODE_ENV=production`
            }
        ]
    },
    {
        category: "Machine Learning",
        titleGenerators: {
            adjectives: ["Predictive", "Generative", "Deep Learning", "Supervised", "Unsupervised", "Reinforcement", "Visual", "NLP"],
            techs: ["PyTorch", "TensorFlow", "Scikit", "Keras", "OpenCV", "HuggingFace", "Pandas", "NumPy"],
            types: ["Model", "Classifier", "Generator", "Pipeline", "RecSys", "Detector", "Chatbot", "Forecaster"]
        },
        descriptionTemplates: [
            "Advanced machine learning model for pattern recognition.",
            "Scalable data pipeline for training and inference.",
            "Experimental research project exploring new architectures.",
            "Production-ready AI service for intelligent automation."
        ],
        tasks: [
            ...COMMON_TASKS,
            "Clean training dataset", "Tune hyperparameters for Random Forest", "Deploy model to AWS SageMaker",
            "Optimize inference latency", "Visualize confusion matrix", "Implement data augmentation",
            "Refactor feature engineering pipeline", "Upgrade pandas version", "Implement early stopping",
            "Setup MLflow tracking", "Convert model to ONNX format", "Fix data leakage in validation split",
            "Impute missing values in dataset", "Analyze feature importance", "Setup GPU training environment",
            "Implement A/B testing for model versions", "Optimize dataloader performance", "Document model architecture"
        ],
        docs: [
            "Model Architecture", "Training Hyperparameters", "Data Lineage", "Evaluation Metrics",
            "Inference API", "Dataset Description", "Experiment Logs"
        ],
        snippets: [
            {
                title: "train", language: "python", extension: "py",
                content: `import torch\nimport torch.nn as nn\nimport torch.optim as optim\n\nmodel = MyModel()\ncriterion = nn.CrossEntropyLoss()\noptimizer = optim.Adam(model.parameters(), lr=0.001)\n\n# Training loop...`
            },
            {
                title: "preprocess", language: "python", extension: "py",
                content: `import pandas as pd\nimport numpy as np\n\ndef clean_data(df):\n    df = df.dropna()\n    df['category'] = df['category'].astype('category')\n    return df`
            },
            {
                title: "requirements", language: "text", extension: "txt",
                content: `numpy==1.21.0\npandas==1.3.0\ntorch==1.9.0\nscikit-learn==0.24.2\nmatplotlib==3.4.2`
            },
            {
                title: "inference", language: "python", extension: "py",
                content: `def predict(input_data):\n    model.eval()\n    with torch.no_grad():\n        output = model(input_data)\n        return output.argmax(dim=1)`
            }
        ]
    },
    {
        category: "Mobile",
        titleGenerators: {
            adjectives: ["Native", "Hybrid", "Cross-platform", "Offline-first", "Social", "Utility", "Gaming", "AR"],
            techs: ["React Native", "Flutter", "SwiftUI", "Kotlin", "Ionic", "Expo", "Unity", "Android"],
            types: ["App", "Client", "Game", "Wallet", "Messenger", "Scanner", "Tracker", "Navigator"]
        },
        descriptionTemplates: [
            "Cross-platform mobile experience for iOS and Android.",
            "Native performance with a fluid user interface.",
            "Offline-capable application for field operations.",
            "Social networking app connecting users worldwide."
        ],
        tasks: [
            ...COMMON_TASKS,
            "Fix splash screen delay", "Implement push notifications", "Optimize battery usage",
            "Add biometric authentication", "Fix keyboard overlapping input fields", "Update app store screenshots",
            "Request camera permissions correctly", "Implement deep linking", "Refactor navigation stack",
            "Add offline support with SQLite", "Fix layout on iPhone Mini", "Upgrade Gradle version",
            "Profile memory usage in Xcode", "Implement in-app purchases", "Add haptic feedback"
        ],
        docs: [
            "App Store Guidelines", "Design Specs", "Architecture Overview", "Release Checklist",
            "Deep Link Schema", "Analytics Events"
        ],
        snippets: [
            {
                title: "App", language: "typescript", extension: "tsx",
                content: `import React from 'react';\nimport { NavigationContainer } from '@react-navigation/native';\n\nexport default function App() {\n  return (\n    <NavigationContainer>\n      {/* Screens */}\n    </NavigationContainer>\n  );\n}`
            },
            {
                title: "styles", language: "javascript", extension: "js",
                content: `import { StyleSheet } from 'react-native';\n\nexport const styles = StyleSheet.create({\n  container: {\n    flex: 1,\n    backgroundColor: '#fff',\n    alignItems: 'center',\n    justifyContent: 'center',\n  },\n});`
            }
        ]
    },
    {
        category: "DevOps",
        titleGenerators: {
            adjectives: ["Automated", "Resilient", "Cloud-native", "GitOps", "Immutable", "Elastic", "Monitoring", "Infrastructure"],
            techs: ["Terraform", "Kubernetes", "Ansible", "Jenkins", "Prometheus", "AWS", "Azure", "GCP"],
            types: ["Pipeline", "Cluster", "Config", "Monitor", "Registry", "Gateway", "Mesh", "Stack"]
        },
        descriptionTemplates: [
            "Infrastructure as Code managing cloud resources.",
            "Automated CI/CD pipeline for rapid deployment.",
            "Observability stack for monitoring system health.",
            "Kubernetes cluster configuration for microservices."
        ],
        tasks: [
            ...COMMON_TASKS,
            "Provision EKS cluster", "Rotate IAM keys", "Optimize auto-scaling policies",
            "Setup Grafana dashboards", "Configure ELK stack", "Write Terraform modules for VPC",
            "Audit security groups", "Implement canary deployments", "Reduce build time costs",
            "Setup backup retention policy", "Monitor pod resource usage", "Upgrade Kubernetes version",
            "Configure SSL certificates with Cert-Manager", "Setup PagerDuty integration", "Harden bastion host"
        ],
        docs: [
            "Architecture Diagram", "Disaster Recovery", "Runbook", "Security Policy",
            "Cost Analysis", "Service Level Objectives"
        ],
        snippets: [
            {
                title: "main", language: "hcl", extension: "tf",
                content: `provider "aws" {\n  region = "us-west-2"\n}\n\nresource "aws_s3_bucket" "b" {\n  bucket = "my-tf-test-bucket"\n  acl    = "private"\n}`
            },
            {
                title: "k8s-deployment", language: "yaml", extension: "yaml",
                content: `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: nginx-deployment\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: nginx`
            },
            {
                title: "Jenkinsfile", language: "groovy", extension: "groovy",
                content: `pipeline {\n    agent any\n    stages {\n        stage('Build') {\n            steps {\n                sh 'echo "Building..."'\n            }\n        }\n    }\n}`
            }
        ]
    }
];

// --- Helpers ---

function getRandom(arr: any[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubset(arr: any[], min: number, max: number) {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function generateTitle(generators: ProjectArchetype['titleGenerators']) {
    const adj = getRandom(generators.adjectives);
    const tech = getRandom(generators.techs);
    const type = getRandom(generators.types);
    return `${adj} ${tech} ${type}`;
}

// --- Main Script ---

async function main() {
    console.log('🌱 Starting CURATED (Expanded) seed script...');

    // 1. Idempotency Check
    const existingSeedUser = await prisma.user.findFirst({ where: { email: 'seed@devcollab.com' } });
    if (existingSeedUser) {
        const projectCount = await prisma.project.count({ where: { ownerId: existingSeedUser.id } });
        if (projectCount > 0) {
            console.log(`⚠️  Seed data already exists (${projectCount} projects). Skipping...`);
            console.log(`💡 Run 'npm run clean' to wipe existing data first.`);
            return;
        }
    }

    // 2. Create User
    console.log('👤 Creating seed user...');
    // Upsert to handle edge cases
    const seedUser = await prisma.user.upsert({
        where: { email: 'seed@devcollab.com' },
        update: {},
        create: {
            email: 'seed@devcollab.com',
            name: 'Senior Engineer',
            image: 'https://i.pravatar.cc/150?u=seed',
        }
    });

    // 3. Generate Projects
    const projectsToCreate = TARGET_PROJECT_COUNT;
    console.log(`🚀 Seeding ${projectsToCreate} highly varied projects...`);

    let createdCount = 0;
    while (createdCount < projectsToCreate) {
        const batchSize = Math.min(BATCH_SIZE, projectsToCreate - createdCount);
        const projectsData: any[] = [];
        const tasksData: any[] = [];
        const docsData: any[] = [];
        const snippetsData: any[] = [];

        for (let i = 0; i < batchSize; i++) {
            const archetype = getRandom(ARCHETYPES);
            const title = generateTitle(archetype.titleGenerators);

            // Pre-generate ID
            const projectId = crypto.randomUUID();
            const createdAt = new Date(Date.now() - Math.floor(Math.random() * 10000000000));
            const updatedAt = new Date();

            projectsData.push({
                id: projectId,
                title: title,
                description: getRandom(archetype.descriptionTemplates),
                ownerId: seedUser.id,
                isPublic: Math.random() > 0.5,
                createdAt,
                updatedAt
            });

            // Tasks
            const selectedTasks = getRandomSubset(archetype.tasks, 4, 8); // Updated count
            selectedTasks.forEach((taskTitle: string) => {
                tasksData.push({
                    title: taskTitle,
                    projectId: projectId,
                    status: getRandom(['TODO', 'IN_PROGRESS', 'DONE']),
                    createdAt,
                    updatedAt
                });
            });

            // Docs
            const selectedDocs = getRandomSubset(archetype.docs, 2, 5); // Updated count
            selectedDocs.forEach((docLabel: string) => {
                docsData.push({
                    label: `${docLabel}.md`,
                    projectId: projectId,
                    roomId: crypto.randomUUID(),
                    content: {},
                    createdAt,
                    updatedAt
                });
            });

            // Snippets
            const selectedSnippets = getRandomSubset(archetype.snippets, 3, 5); // Updated count
            selectedSnippets.forEach((template: SnippetTemplate) => {
                snippetsData.push({
                    title: template.title, // No extension included in base title
                    language: template.language,
                    extension: template.extension,
                    content: JSON.stringify(template.content), // Stringify for frontend compatibility
                    projectId: projectId,
                    createdAt,
                    updatedAt
                });
            });
        }

        // Transaction insert
        await prisma.$transaction([
            prisma.project.createMany({ data: projectsData }),
            prisma.task.createMany({ data: tasksData }),
            prisma.doc.createMany({ data: docsData }),
            prisma.snippet.createMany({ data: snippetsData }),
        ]);

        createdCount += batchSize;
        console.log(`📦 Created ${createdCount}/${projectsToCreate} projects.`);
    }

    console.log('✅ Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
