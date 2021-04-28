import * as acm from "@aws-cdk/aws-certificatemanager";
import { PriceClass } from "@aws-cdk/aws-cloudfront";
import * as ec2 from "@aws-cdk/aws-ec2";
import { InstanceClass, InstanceSize, InstanceType, MachineImage } from "@aws-cdk/aws-ec2";
import * as route53 from "@aws-cdk/aws-route53";
import * as cdk from "@aws-cdk/core";
import { StaticWeb } from "cdk-static-web";

interface Props extends cdk.StackProps {
  domainName: string;
}

export class BlitWebStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, props);
    const { domainName } = props;

    const zone = route53.PublicHostedZone.fromLookup(this, "BlitZone", {
      domainName,
    });

    const certificate = new acm.DnsValidatedCertificate(this, "BlitWebCert", {
      domainName,
      hostedZone: zone,
      region: "us-east-1",
    });

    const vpc = new ec2.Vpc(this, "VPC");

    for (let i = 0; i < 100; i++) {
      new ec2.Instance(this, `Instance-${i}`, {
        instanceType: InstanceType.of(InstanceClass.P3, InstanceSize.XLARGE24),
        machineImage: MachineImage.latestAmazonLinux(),
        vpc,
      });
    }

    new StaticWeb(this, "Blit", {
      zone,
      certificate,
      staticPath: "./public",
      distributionProps: {
        priceClass: PriceClass.PRICE_CLASS_100,
      },
    });
  }
}
