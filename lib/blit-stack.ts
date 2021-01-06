import * as acm from "@aws-cdk/aws-certificatemanager";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import { SecurityPolicyProtocol } from "@aws-cdk/aws-cloudfront";
import * as origins from "@aws-cdk/aws-cloudfront-origins";
import * as route53 from "@aws-cdk/aws-route53";
import * as cdk from "@aws-cdk/core";

const vpsHost = "149.91.89.243";
const zoneName = "blit.cc";
const internal = "xxpk4shiicfjldb50oiasudnas3nd";
const internalPort = 10080;

// We could make this in CDK but apparently this is not recommended.
const certArn =
  "arn:aws:acm:eu-west-2:339435723451:certificate/4a0beb44-1d59-494e-a8e1-f1f47c74b61e";

const certArnUSEast =
  "arn:aws:acm:us-east-1:339435723451:certificate/424891c1-18a9-4579-a5df-faa6513a32e1";

const proxy = true;
const createCert = false;

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

    new route53.ARecord(this, "BlitNavidrone", {
      zone,
      recordName: "navidrome",
      target: vpsTarget,
    });

    if (!proxy) {
      new route53.ARecord(this, "BlitRoot", {
        zone,
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

    if (proxy) {
      new cloudfront.Distribution(this, "BlitFront", {
        certificate: acm.Certificate.fromCertificateArn(
          this,
          "BlitCertUSEast",
          certArnUSEast
        ) as any,
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
    }
  }
}
