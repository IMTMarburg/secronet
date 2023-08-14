#/usr/bin/env bash
mkdir -p data/events
mkdir -p data/tasks
mkdir -p data/downloads
REMOTE_USER=flo DATABASE_DIR=./database/ yarn dev
