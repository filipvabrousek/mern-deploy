# mern-deploy
Mern deploy to render


Make render.yaml in root

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
