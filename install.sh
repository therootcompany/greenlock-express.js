# This is just an example (but it works)
export NODE_PATH=$NPM_CONFIG_PREFIX/lib/node_modules
export NPM_CONFIG_PREFIX=/opt/node
curl -fsSL https://bit.ly/node-installer | bash

/opt/node/bin/node /opt/node/bin/npm config set scripts-prepend-node-path true
/opt/node/bin/node /opt/node/bin/npm ci
sudo setcap 'cap_net_bind_service=+ep' /opt/node/bin/node
/opt/node/bin/node /opt/node/bin/npm start

sudo rsync -av dist/etc/systemd/system/greenlock-express.service /etc/systemd/system/
sudo systemctl daemon-reload

sudo systemctl restart greenlock-express
