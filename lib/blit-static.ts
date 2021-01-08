import * as acm from "@aws-cdk/aws-certificatemanager";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as route53 from "@aws-cdk/aws-route53";
import * as cdk from "@aws-cdk/core";
import { StaticSite } from "./static-site";

interface Props {
  zone: route53.PublicHostedZone;
}

export class BlitStatic extends cdk.Construct {
  constructor(parent: cdk.Construct, name: string, { zone }: Props) {
    super(parent, name);
    const certificate = new acm.Certificate(this, "Cert", {
      domainName: zone.zoneName,
      validation: acm.CertificateValidation.fromEmail(),
    });
    new cdk.CfnOutput(this, "BlitCertArn", {
      value: certificate.certificateArn,
    });
    new StaticSite(this, "Blit", {
      zone,
      certificate,
      staticPath: "./public",
      distributionProps: {
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      },
    });
  }
}
