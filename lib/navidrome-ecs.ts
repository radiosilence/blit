import * as acm from "@aws-cdk/aws-certificatemanager";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as elbv2 from "@aws-cdk/aws-elasticloadbalancingv2";
import * as route53 from "@aws-cdk/aws-route53";
import * as alias from "@aws-cdk/aws-route53-targets";
import * as cdk from "@aws-cdk/core";

interface Props extends cdk.StackProps {
  domainName: string;
  recordName: string;
}

export class NavidromeECSStack extends cdk.Stack {
  constructor(parent: cdk.Construct, name: string, props: Props) {
    super(parent, name, props);
    // navidrome
    const { domainName, recordName = "nd" } = props;

    const zone = route53.PublicHostedZone.fromLookup(this, "ParentZone", {
      domainName,
    });

    const fullDomainName = `${recordName}.${domainName}`;

    const certificate = new acm.DnsValidatedCertificate(this, "Cert", {
      domainName: fullDomainName,
      hostedZone: zone,
      region: "us-east-1",
    });

    const vpc = new ec2.Vpc(this, "TheVPC");

    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc,
    });

    cluster.addCapacity("DefaultAutoScalingGroupCapacity", {
      instanceType: new ec2.InstanceType("t2.micro"),
      desiredCapacity: 1,
    });

    const taskDefinition = new ecs.Ec2TaskDefinition(this, "TaskDef");

    const container = taskDefinition.addContainer("DefaultContainer", {
      image: ecs.ContainerImage.fromRegistry("deluan/navidrome"),
      memoryLimitMiB: 900,
      environment: {
        ND_SCANINTERVAL: "1m",
        ND_LOGLEVEL: "info",
        ND_SESSIONTIMEOUT: "24h",
        ND_BASEURL: "",
      },
    });

    container.addPortMappings({
      containerPort: 4533,
      hostPort: 4533,
    });

    const service = new ecs.Ec2Service(this, "Service", {
      cluster,
      taskDefinition,
    });

    const lb = new elbv2.ApplicationLoadBalancer(this, "LB", { vpc, internetFacing: true });
    const listener = lb.addListener("Listener", {
      port: 443,
      certificates: [certificate],
      sslPolicy: elbv2.SslPolicy.RECOMMENDED,
    });

    listener.addTargets("ECS1", {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      targets: [
        service.loadBalancerTarget({
          containerName: "web",
          containerPort: 4533,
        }),
      ],
    });

    new route53.ARecord(this, "Record", {
      zone,
      recordName,
      target: route53.RecordTarget.fromAlias(new alias.LoadBalancerTarget(lb)),
    });

    // const volume = ecs.Volume("Volume", {
    //   efsVolumeConfiguration: ec2.EfsVolumeConfiguration({
    //     fileSystemId: "EFS",
    //     // ... other options here ...
    //   }),
    // });

    // taskDefinition.addVolume(volume);

    // const distribution = new cloudfront.Distribution(this, "NavidromeDistribution", {
    //   certificate,
    //   domainNames: [fullDomainName],
    //   priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    //   defaultBehavior: {
    //     origin: new origins.HttpOrigin(`${internalRecordName}.${domainName}`, {
    //       protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
    //       httpPort: navidromePort,
    //     }),
    //     cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
    //     originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
    //     allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
    //     smoothStreaming: true,
    //   },
    // });
  }
}
