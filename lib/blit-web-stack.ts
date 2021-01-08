import * as acm from "@aws-cdk/aws-certificatemanager";
import { PriceClass } from "@aws-cdk/aws-cloudfront";
import * as route53 from "@aws-cdk/aws-route53";
import * as cdk from "@aws-cdk/core";
import { Navidrome } from "./navidrome";
import { StaticSite } from "./static-site";

interface BlitStackProps extends cdk.StackProps {
  vpsIp: string;
  zoneName: string;
  internal: string;
  navidromePort: number;
}

export class BlitWebStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: BlitStackProps) {
    super(scope, id, props);
    const { zoneName } = props;

    const zone = route53.PublicHostedZone.fromLookup(this, "BlitZone", {
      domainName: "blit.cc",
    });

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
        priceClass: PriceClass.PRICE_CLASS_100,
      },
    });

    new Navidrome(this, "Navidrome", {
      rootZoneName: zoneName,
      internalRecordName: props.internal,
      navidromePort: props.navidromePort,
      vpsIp: props.vpsIp,
      zone,
    });
  }
}
