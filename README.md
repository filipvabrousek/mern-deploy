# mern-deploy
Mern deploy to render


Make ```render.yaml``` in root

```yaml
services:
  - type: web
    name: mern-test-app
    env: node
    plan: free
    buildCommand: npm install && npm run heroku-postbuild
    startCommand: npm start
    branch: main
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGO_URI
        value: mongodb+srv://<username>:<password>@cluster0.mongodb.net/testdb
      - key: JWT_SECRET
        value: super_secret_key_123
```

1) https://dashboard.render.com/ click on add new project
2) Add GitHub project
3) Manual deploy => deploy latest commit

https://mern-deploy-78du.onrender.com/questions


## Adding secrets
1) Environment
2) ```VITE_API_URL``` ```https://mern-deploy-78du.onrender.com```
3) ``` echo VITE_API_URL=http://localhost:3002> .env.development``` in vite-project root (optional)
4) Code:
```js
export const useExamAPI = () => {

  const API = import.meta.env.VITE_API_URL || "http://localhost:3002"; // 213117 cool 28/10/25

  const fetchJSON = async (endpoint, options = {}) => {
    const res = await fetch(`${API}${endpoint}`, {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Fetch error ${res.status}: ${text}`);
    }

    return res.json();
  };

// ...
```
