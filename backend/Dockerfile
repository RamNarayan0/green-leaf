FROM node:18-alpine`n`nWORKDIR /app`n`nCOPY package*.json ./`n`nRUN npm ci`n`nCOPY . .`n`nEXPOSE 5000`n`nENV NODE_ENV=production`nENV PORT=5000`n`nCMD ["node", "server.js"]
