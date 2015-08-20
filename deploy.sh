#!/bin/bash
grunt
gcloud config set project bqdu-app
gcloud preview app deploy -q dist/app.yaml --set-default
