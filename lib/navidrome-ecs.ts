import * as acm from "@aws-cdk/aws-certificatemanager";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as efs from "@aws-cdk/aws-efs";
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
    });

    const vpc = new ec2.Vpc(this, "TheVPC", {});

    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc,
    });

    cluster.addCapacity("DefaultAutoScalingGroupCapacity", {
      instanceType: new ec2.InstanceType("t2.micro"),
      desiredCapacity: 1,
    });

    const dataFileSystem = new efs.FileSystem(this, "DataFileSystem", {
      vpc,
      encrypted: true, // file system is not encrypted by default
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_14_DAYS, // files are not transitioned to infrequent access (IA) storage by default
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE, // default
    });

    const musicFileSystem = new efs.FileSystem(this, "MusicFileSystem", {
      vpc,
      encrypted: true, // file system is not encrypted by default
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_14_DAYS, // files are not transitioned to infrequent access (IA) storage by default
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE, // default
    });

    const dataVolumeConfig: ecs.Volume = {
      name: "data",
      efsVolumeConfiguration: {
        fileSystemId: dataFileSystem.fileSystemId,
      },
    };

    const musicVolumeConfig: ecs.Volume = {
      name: "music",
      efsVolumeConfiguration: {
        fileSystemId: musicFileSystem.fileSystemId,
      },
    };

    const taskDefinition = new ecs.Ec2TaskDefinition(this, "TaskDef", {
      volumes: [dataVolumeConfig, musicVolumeConfig],
    });

    const container = taskDefinition.addContainer("web", {
      logging: new ecs.AwsLogDriver({ streamPrefix: "NavidromeWeb" }),
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

    container.addMountPoints(
      {
        readOnly: false,
        containerPath: "/data",
        sourceVolume: dataVolumeConfig.name,
      },
      {
        readOnly: true,
        containerPath: "/music",
        sourceVolume: musicVolumeConfig.name,
      }
    );

    const service = new ecs.Ec2Service(this, "Service", {
      cluster,
      taskDefinition,
    });

    const lb = new elbv2.ApplicationLoadBalancer(this, "LB", { vpc, internetFacing: true });
    const listener = lb.addListener("Listener", {
      port: 443,
      certificates: [elbv2.ListenerCertificate.fromCertificateManager(certificate)],
      sslPolicy: elbv2.SslPolicy.RECOMMENDED,
    });

    listener.addTargets("ECS1", {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      targets: [
        service.loadBalancerTarget({
          containerPort: 4533,
          containerName: "web",
        }),
      ],
    });

    new route53.ARecord(this, "Record", {
      zone,
      recordName,
      target: route53.RecordTarget.fromAlias(new alias.LoadBalancerTarget(lb)),
    });
  }
}
