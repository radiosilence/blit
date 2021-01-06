import * as acm from "@aws-cdk/aws-certificatemanager";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import { SecurityPolicyProtocol } from "@aws-cdk/aws-cloudfront";
import * as origins from "@aws-cdk/aws-cloudfront-origins";
import * as route53 from "@aws-cdk/aws-route53";
import * as alias from "@aws-cdk/aws-route53-targets";
import * as cdk from "@aws-cdk/core";

const vpsHost = "149.91.89.243";
const zoneName = "blit.cc";
const internal = "xxpk4shiicfjldb50oiasudnas3nd";
const internalPort = 10080;
const navidromePort = 4533;
const useCloudFront = true;

export class BlitStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const zone = new route53.PublicHostedZone(this, "BlitCC", {
      zoneName,
    });

    const vpsTarget = route53.RecordTarget.fromIpAddresses(vpsHost);

    new route53.ARecord(this, "BlitInternal", {
      zone,
      recordName: internal,
      target: vpsTarget,
    });

    if (!useCloudFront) {
      new route53.ARecord(this, "BlitRoot", {
        zone,
        target: vpsTarget,
      });

      new route53.ARecord(this, "BlitNavidrome", {
        zone,
        recordName: "nd",
        target: vpsTarget,
      });
    }

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

    const certificate = new acm.Certificate(this, "BlitCert", {
      domainName: "blit.cc",
      subjectAlternativeNames: ["*.blit.cc"],
      validation: acm.CertificateValidation.fromEmail(),
    });

    if (useCloudFront) {
      const distribution = new cloudfront.Distribution(this, "BlitFront", {
        certificate,
        domainNames: ["blit.cc"],
        enableIpv6: true,
        httpVersion: cloudfront.HttpVersion.HTTP2,
        minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2019,
        defaultBehavior: {
          origin: new origins.HttpOrigin(`${internal}.blit.cc`, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
            httpPort: internalPort,
          }),
        },
      });

      new route53.ARecord(this, "BlitFrontRecord", {
        zone,
        target: route53.RecordTarget.fromAlias(
          new alias.CloudFrontTarget(distribution)
        ),
      });

      const ndDistribution = new cloudfront.Distribution(
        this,
        "BlitFrontNavidrome",
        {
          certificate,
          domainNames: ["nd.blit.cc"],
          enableIpv6: true,
          httpVersion: cloudfront.HttpVersion.HTTP2,
          minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2019,
          priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
          defaultBehavior: {
            origin: new origins.HttpOrigin(`${internal}.blit.cc`, {
              protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
              httpPort: navidromePort,
            }),
            cachePolicy: {
              cachePolicyId: "Managed-CachingDisable",
            },
            originRequestPolicy: {
              originRequestPolicyId: "Managed-AllViewer",
            },
          },
        }
      );

      new route53.ARecord(this, "BlitFrontNavidromeRecord", {
        zone,
        target: route53.RecordTarget.fromAlias(
          new alias.CloudFrontTarget(ndDistribution)
        ),
      });
    }
  }
}
