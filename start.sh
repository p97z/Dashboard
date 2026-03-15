#!/bin/bash
export PATH="/home/junk/.nvm/versions/node/v24.14.0/bin:$PATH"
cd /home/junk/dev/dashboard/backend
exec node dist/index.js
