#!/bin/bash

#download node and npm
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Check the npm version
sudo npm --version

#Now, install pm2
sudo npm install -g pm2 -y

#PM2 start on server start
sudo pm2 startup systemd

#create our working directory if it doesnt exist
DIR="/home/ubuntu/Backend"
if [ -d "$DIR" ]; then
  echo "${DIR} exists"
else
  echo "Creating ${DIR} directory"
  mkdir ${DIR}
fi