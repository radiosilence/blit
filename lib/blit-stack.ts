import * as acm from "@aws-cdk/aws-certificatemanager";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as origins from "@aws-cdk/aws-cloudfront-origins";
import * as route53 from "@aws-cdk/aws-route53";
import * as alias from "@aws-cdk/aws-route53-targets";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3deploy from "@aws-cdk/aws-s3-deployment";
import * as cdk from "@aws-cdk/core";

interface BlitStackProps extends cdk.StackProps {
  vpsHost: string;
  zoneName: string;
  internal: string;
  navidromePort: number;
}

export class BlitStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: BlitStackProps) {
    super(scope, id, props);

    const { vpsHost, zoneName, internal, navidromePort } = props;

    const zone = new route53.PublicHostedZone(this, "BlitCC", {
      zoneName,
    });

    new cdk.CfnOutput(this, "BlitZone", {
      value: zone.hostedZoneArn,
      exportName: "BlitZone",
    });

    const vpsTarget = route53.RecordTarget.fromIpAddresses(vpsHost);

    new route53.ARecord(this, "BlitInternal", {
      zone,
      recordName: internal,
      target: vpsTarget,
    });

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
        domainName: `fm${n}.blit.cc.dkim.fmhosted.com.`,
      });
    }

    const certificate = new acm.DnsValidatedCertificate(this, "BlitCert", {
      hostedZone: zone,
      domainName: zoneName,
      subjectAlternativeNames: ["*.blit.cc"],
      region: "us-east-1",
    });

    new cdk.CfnOutput(this, "BlitCertArn", {
      value: certificate.certificateArn,
    });

    const bucket = new s3.Bucket(this, "BlitBucket", {
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
    });

    const distribution = new cloudfront.Distribution(this, "BlitFront", {
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        origin: new origins.S3Origin(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      domainNames: ["blit.cc"],
      certificate,
    });

    new s3deploy.BucketDeployment(this, "BlitDeployment", {
      sources: [s3deploy.Source.asset("./public")],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ["/*"],
    });

    new route53.ARecord(this, "BlitFrontRecord", {
      zone,
      target: route53.RecordTarget.fromAlias(new alias.CloudFrontTarget(distribution)),
    });

    // navidrome
    const ndDistribution = new cloudfront.Distribution(this, "BlitFrontNavidrome", {
      certificate,
      domainNames: ["nd.blit.cc"],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        origin: new origins.HttpOrigin(`${internal}.blit.cc`, {
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
      zoneName: `nd.${zoneName}`,
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
