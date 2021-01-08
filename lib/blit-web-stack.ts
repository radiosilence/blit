import * as acm from "@aws-cdk/aws-certificatemanager";
import { PriceClass } from "@aws-cdk/aws-cloudfront";
import * as route53 from "@aws-cdk/aws-route53";
import * as cdk from "@aws-cdk/core";
import { StaticSite } from "./static-site";

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

    const certificate = new acm.DnsValidatedCertificate(this, "Cert", {
      hostedZone: zone,
      domainName,
    });

    new cdk.CfnOutput(this, "BlitCertArn", {
      value: certificate.certificateArn,
    });

    new StaticSite(this, "Blit", {
      zone,
      certificate,
      staticPath: "./public",
      distributionProps: {
        priceClass: PriceClass.PRICE_CLASS_100,
      },
    });
  }
}