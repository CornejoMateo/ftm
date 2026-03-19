FROM node:20-alpine

WORKDIR /app

# Install only the Next.js app dependencies from /src
COPY src/package*.json ./
RUN npm ci

# Copy the Next.js app source
COPY src/ ./

# Build Next.js for production
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
