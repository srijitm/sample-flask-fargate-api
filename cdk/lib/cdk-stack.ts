import * as cdk from '@aws-cdk/core';
import * as ecs from "@aws-cdk/aws-ecs";
import * as ecsPatterns from "@aws-cdk/aws-ecs-patterns";
import ssm = require('@aws-cdk/aws-ssm');
import * as path from 'path';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const loadBalancedFargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'service', {
      memoryLimitMiB: 1024,
      cpu: 512,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../../', "app"), {
          repositoryName: 'acme/demo/python/flask-api'
        }),
        containerName: 'flask-api',
        containerPort: 5000,
      },
      serviceName: 'flask-api-service',
      assignPublicIp: false,
      desiredCount: 2
    });
    
    loadBalancedFargateService.targetGroup.configureHealthCheck({
      path: "/",
      port: "5000"
    });

  }
}
