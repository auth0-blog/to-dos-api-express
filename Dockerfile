FROM node:10

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

# env variables (with default value)
ARG AUTH0_DOMAIN=blog-samples.auth0.com
ENV AUTH0_DOMAIN=$AUTH0_DOMAIN

ARG AUTH0_API=https://to-dos-api
ENV AUTH0_API=$AUTH0_API

EXPOSE 3001
CMD [ "npm", "start" ]
