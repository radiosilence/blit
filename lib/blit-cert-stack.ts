import * as acm from "@aws-cdk/aws-certificatemanager";
import * as route53 from "@aws-cdk/aws-route53";
import * as cdk from "@aws-cdk/core";

interface Props extends cdk.StackProps {
  domainName: string;
}

export enum BlitCertOutput {
  Cert = "BlitCert",
}

export class BlitCertStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, props);
    const { domainName } = props;

    const zone = route53.PublicHostedZone.fromLookup(this, "BlitZone", {
      domainName,
    });

    const certificate = new acm.DnsValidatedCertificate(this, "BlitWildcardCert", {
      hostedZone: zone,
      domainName,
      subjectAlternativeNames: [`*.${domainName}`, `ass.${domainName}`],
      region: "us-east-1",
    });

    new cdk.CfnOutput(this, "BlitCertOutput", {
      value: certificate.certificateArn,
      exportName: BlitCertOutput.Cert,
    });
  }
}
