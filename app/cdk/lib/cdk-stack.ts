import * as cdk from '@aws-cdk/core';
import * as ecs from "@aws-cdk/aws-ecs";
import * as ecsPatterns from "@aws-cdk/aws-ecs-patterns";
import ec2 = require('@aws-cdk/aws-ec2');
import apigw = require('@aws-cdk/aws-apigatewayv2');
import iam = require('@aws-cdk/aws-iam');
import * as path from 'path';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = this.node.tryGetContext('use_default_vpc') === '1' ?
      ec2.Vpc.fromLookup(this, 'Vpc', { isDefault: true }) :
      this.node.tryGetContext('use_vpc_id') ?
        ec2.Vpc.fromLookup(this, 'Vpc', { vpcId: this.node.tryGetContext('use_vpc_id') }) :
        new ec2.Vpc(this, 'Vpc', { maxAzs: 3, natGateways: 1 });

    const loadBalancedFargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'service', {
      vpc,
      memoryLimitMiB: 1024,
      cpu: 512,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../../', "src"), {
          repositoryName: 'acme/demo/apigw-ecs'
        }),
        containerName: 'flask-api',
        containerPort: 5000,
      },
      assignPublicIp: false,
      desiredCount: 2,
      publicLoadBalancer: false
    });
    
    loadBalancedFargateService.targetGroup.configureHealthCheck({
      path: "/health",
      port: "5000"
    });

    const taskPolicy = new iam.PolicyStatement()
    taskPolicy.addAllResources()
    taskPolicy.addActions(
      "s3:Get*",
      "s3:List*",
      "s3:Describe*",
      "s3:PutObject"
    )
    loadBalancedFargateService.taskDefinition.taskRole.addToPrincipalPolicy(taskPolicy)

    const httpVpcLink = new cdk.CfnResource(this, "HttpVpcLink", {
      type: "AWS::ApiGatewayV2::VpcLink",
      properties: {
        Name: "Sample Flask Fargate VPC Link",
        SubnetIds: vpc.privateSubnets.map(m => m.subnetId)
      }
    });

    const api = new apigw.HttpApi(this, "HttpApiGateway", {
      createDefaultStage: true
    });

    const integration = new apigw.CfnIntegration(this, "HttpApiGatewayIntegration", {
      apiId: api.httpApiId,
      connectionId: httpVpcLink.ref,
      connectionType: "VPC_LINK",
      description: "Sample Flask Fargate API Integration",
      integrationMethod: "ANY",
      integrationType: "HTTP_PROXY",
      integrationUri: loadBalancedFargateService.listener.listenerArn,
      payloadFormatVersion: "1.0",
    });

    new apigw.CfnRoute(this, 'Route', {
      apiId: api.httpApiId,
      routeKey: 'ANY /{proxy+}',
      target: `integrations/${integration.ref}`,
    })

    new cdk.CfnOutput(this, 'APIUrl', { value: api.url! })
  }
}
