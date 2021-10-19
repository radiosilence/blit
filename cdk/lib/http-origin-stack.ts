import * as acm from "@aws-cdk/aws-certificatemanager";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as origins from "@aws-cdk/aws-cloudfront-origins";
import * as route53 from "@aws-cdk/aws-route53";
import * as alias from "@aws-cdk/aws-route53-targets";
import * as cdk from "@aws-cdk/core";

interface Props extends cdk.StackProps {
  /**
   * The parent name to add the subdomain to
   */
  domainName: string;
  /** Upstream
   *
   */
  upstream: {
    addresses: string[];
    port: number;
  };
  /**
   * The subdomain that will point to the distribution
   */
  recordName: string;
}

export class HttpOriginStack extends cdk.Stack {
  constructor(parent: cdk.Construct, name: string, props: Props) {
    super(parent, name, props);
    // navidrome
    const { upstream, domainName, recordName } = props;

    const zone = route53.PublicHostedZone.fromLookup(this, "Zone", {
      domainName,
    });

    const upstreamRecord = new route53.ARecord(this, "Internal", {
      zone,
      recordName: `upstream.${parent.node.addr}`,
      target: route53.RecordTarget.fromIpAddresses(...upstream.addresses),
    });

    const fullDomainName = `${recordName}.${domainName}`;

    const certificate = new acm.DnsValidatedCertificate(this, "Certificate", {
      domainName: fullDomainName,
      hostedZone: zone,
      region: "us-east-1",
    });

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      certificate,
      domainNames: [fullDomainName],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        origin: new origins.HttpOrigin(upstreamRecord.domainName, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          httpPort: upstream.port,
        }),
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        smoothStreaming: true,
      },
    });

    new route53.ARecord(this, "Record", {
      zone,
      recordName,
      target: route53.RecordTarget.fromAlias(new alias.CloudFrontTarget(distribution)),
    });
  }
}