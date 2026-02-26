#!/bin/bash
cd /home/kavia/workspace/code-generation/autobrowse-car-brochure-326867-326883/car_brochure_frontend
npm run lint
ESLINT_EXIT_CODE=$?
npm run build
BUILD_EXIT_CODE=$?
if [ $ESLINT_EXIT_CODE -ne 0 ] || [ $BUILD_EXIT_CODE -ne 0 ]; then
   exit 1
fi

