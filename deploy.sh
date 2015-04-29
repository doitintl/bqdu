#!/bin/bash
grunt
gcloud config set project bqdu-app
gcloud preview app deploy dist/app.yaml