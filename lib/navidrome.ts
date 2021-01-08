import * as acm from "@aws-cdk/aws-certificatemanager";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as origins from "@aws-cdk/aws-cloudfront-origins";
import * as route53 from "@aws-cdk/aws-route53";
import * as alias from "@aws-cdk/aws-route53-targets";
import * as cdk from "@aws-cdk/core";

interface Props {
  rootZoneName: string;
  internalRecordName: string;
  navidromePort: number;
  vpsIp: string;
  zone: route53.IHostedZone;
  recordName?: string;
}

export class Navidrome extends cdk.Construct {
  constructor(parent: cdk.Construct, name: string, props: Props) {
    super(parent, name);
    // navidrome
    const { vpsIp, rootZoneName, zone, internalRecordName, navidromePort, recordName = "ns" } = props;
    const vpsTarget = route53.RecordTarget.fromIpAddresses(vpsIp);

    new route53.ARecord(this, "BlitInternal", {
      zone,
      recordName: internalRecordName,
      target: vpsTarget,
    });

    const zoneName = `${recordName}.${rootZoneName}`;

    const certificate = new acm.Certificate(this, "NDCert", {
      domainName: zoneName,
      validation: acm.CertificateValidation.fromEmail(),
    });

    const ndDistribution = new cloudfront.Distribution(this, "BlitFrontNavidrome", {
      certificate,
      domainNames: [zoneName],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        origin: new origins.HttpOrigin(`${internalRecordName}.${rootZoneName}`, {
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
        recordName,
        nameServers: ndZone.hostedZoneNameServers,
      });
    }
  }
}
