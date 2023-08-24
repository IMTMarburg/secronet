#/usr/bin/env bash
mkdir -p data/events
mkdir -p data/tasks
mkdir -p data/downloads
yarn
REMOTE_USER=flo DATABASE_DIR=./database/ yarn dev
