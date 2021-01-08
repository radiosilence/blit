import * as acm from "@aws-cdk/aws-certificatemanager";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as origins from "@aws-cdk/aws-cloudfront-origins";
import * as route53 from "@aws-cdk/aws-route53";
import * as alias from "@aws-cdk/aws-route53-targets";
import * as cdk from "@aws-cdk/core";

interface Props extends cdk.StackProps {
  domainName: string;
  internalRecordName: string;
  navidromePort: number;
  vpsIp: string;
  recordName?: string;
}

export class NavidromeStack extends cdk.Stack {
  constructor(parent: cdk.Construct, name: string, props: Props) {
    super(parent, name, props);
    // navidrome
    const { vpsIp, domainName, internalRecordName, navidromePort, recordName = "nd" } = props;

    const zone = route53.PublicHostedZone.fromLookup(this, "BlitZone", {
      domainName,
    });

    const vpsTarget = route53.RecordTarget.fromIpAddresses(vpsIp);

    new route53.ARecord(this, "BlitInternal", {
      zone,
      recordName: internalRecordName,
      target: vpsTarget,
    });

    const fullDomainName = `${recordName}.${domainName}`;

    const certificate = new acm.DnsValidatedCertificate(this, "NavidromeCert", {
      domainName: fullDomainName,
      hostedZone: zone,
      region: "us-east-1",
    });

    const distribution = new cloudfront.Distribution(this, "NavidromeDistribution", {
      certificate,
      domainNames: [fullDomainName],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        origin: new origins.HttpOrigin(`${internalRecordName}.${domainName}`, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          httpPort: navidromePort,
        }),
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        smoothStreaming: true,
      },
    });

    new route53.ARecord(this, "NavidromeRecord", {
      zone,
      recordName,
      target: route53.RecordTarget.fromAlias(new alias.CloudFrontTarget(distribution)),
    });
  }
}
