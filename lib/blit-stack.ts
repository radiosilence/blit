import * as acm from "@aws-cdk/aws-certificatemanager";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as origins from "@aws-cdk/aws-cloudfront-origins";
import * as route53 from "@aws-cdk/aws-route53";
import * as alias from "@aws-cdk/aws-route53-targets";
import * as cdk from "@aws-cdk/core";
import { StaticSite } from "./static-site";

interface BlitStackProps extends cdk.StackProps {
  vpsHost: string;
  zoneName: string;
  internal: string;
  navidromePort: number;
}

const staticSite = true;

export class BlitStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: BlitStackProps) {
    super(scope, id, props);

    const { zoneName } = props;

    const zone = new route53.PublicHostedZone(this, "BlitZone", {
      zoneName,
    });

    const certificate = new acm.Certificate(this, `Cert`, {
      domainName: zoneName,
      validation: acm.CertificateValidation.fromEmail(),
    });

    if (staticSite) {
      const { certificate } = new StaticSite(this, "Blit", {
        zoneName: "blit.cc",
        zone,
        staticPath: "./public",
        distributionProps: {
          priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        },
      });
    }

    new cdk.CfnOutput(this, "BlitCertArn", {
      value: certificate.certificateArn,
    });

    this.setupEmail(zoneName, zone);
    // this.setupNavidrome(zone, props);
  }

  setupEmail(zoneName: string, zone: route53.PublicHostedZone) {
    new route53.TxtRecord(this, "BlitSPF", {
      zone,
      values: ["v=spf1 include:spf.messagingengine.com ?all", "hi mum"],
    });

    new route53.MxRecord(this, "BlitMX", {
      zone,
      values: [
        { priority: 10, hostName: "in1-smtp.messagingengine.com." },
        { priority: 20, hostName: "in2-smtp.messagingengine.com." },
      ],
    });

    for (const n of [1, 2, 3]) {
      new route53.CnameRecord(this, `BlitDKIM${n}`, {
        zone,
        recordName: `fm${n}.domainkey`,
        domainName: `fm${n}.${zoneName}.dkim.fmhosted.com.`,
      });
    }
  }

  setupNavidrome(
    zone: route53.PublicHostedZone,
    { zoneName: rootZoneName, internal, navidromePort, vpsHost }: BlitStackProps
  ) {
    // navidrome
    const vpsTarget = route53.RecordTarget.fromIpAddresses(vpsHost);

    new route53.ARecord(this, "BlitInternal", {
      zone,
      recordName: internal,
      target: vpsTarget,
    });

    const zoneName = `nd.${rootZoneName}`;

    const certificate = new acm.Certificate(this, "NDCert", {
      domainName: zoneName,
      validation: acm.CertificateValidation.fromEmail(), // Optional, this is the default
    });

    const ndDistribution = new cloudfront.Distribution(this, "BlitFrontNavidrome", {
      certificate,
      domainNames: [zoneName],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        origin: new origins.HttpOrigin(`${internal}.${rootZoneName}`, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          httpPort: navidromePort,
        }),
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        smoothStreaming: true,
      },
    });

    const ndZone = new route53.PublicHostedZone(this, "NDBlitCC", {
      zoneName,
    });

    new route53.ARecord(this, "BlitFrontNavidromeRecord", {
      zone: ndZone,
      target: route53.RecordTarget.fromAlias(new alias.CloudFrontTarget(ndDistribution)),
    });

    // Delegate to subdomain
    if (ndZone.hostedZoneNameServers) {
      new route53.ZoneDelegationRecord(this, "BlitFrontNdDelegations", {
        zone,
        recordName: "nd",
        nameServers: ndZone.hostedZoneNameServers,
      });
    }
  }
}
