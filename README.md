# Sample Flask API

## Description

This project will build a basic Python Flask API docker image and run it on ECS Fargate using AWS CDK.

** Note: This is not Production grade and simply meant as a demo **

## AWS Services

* ECS Fargate
* Application Load Balancer

## Pre-Requisites

* Docker
* AWS CLI configured with appropriate permissions.

## Instructions

```bash
cd cdk
npm install
npm run build
cdk bootstrap # Only needs to be executed once
cdk deploy # To deploy and pay $$ to AWS
cdk destroy # To delete the stack and stop paying $$ to AWS
```
