import * as acm from "@aws-cdk/aws-certificatemanager";
import * as route53 from "@aws-cdk/aws-route53";
import * as cdk from "@aws-cdk/core";

interface Props extends cdk.StackProps {
  domainName: string;
}

export class TestCertStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, props);
    const { domainName } = props;

    const zone = route53.PublicHostedZone.fromLookup(this, "BlitZone", {
      domainName,
    });

    new acm.DnsValidatedCertificate(this, "TestBlitCert", {
      hostedZone: zone,
      domainName: "blit.cc",
      subjectAlternativeNames: ["poop.blit.cc", "butt.blit.cc"],
    });
  }
}
