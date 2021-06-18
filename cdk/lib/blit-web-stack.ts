import * as acm from "@aws-cdk/aws-certificatemanager";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as route53 from "@aws-cdk/aws-route53";
import * as cdk from "@aws-cdk/core";
import { StaticWeb } from "cdk-static-web";

interface Props extends cdk.StackProps {
  domainName: string;
  staticPath: string;
}

export class BlitWebStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, props);
    const { domainName, staticPath } = props;

    const zone = route53.PublicHostedZone.fromLookup(this, "BlitZone", {
      domainName,
    });

    const certificate = new acm.DnsValidatedCertificate(this, "BlitWebCert", {
      domainName,
      hostedZone: zone,
      region: "us-east-1",
    });

    new StaticWeb(this, "Blit", {
      zone,
      certificate,
      staticPath,
      distributionProps: {
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      },
    });
  }
}
