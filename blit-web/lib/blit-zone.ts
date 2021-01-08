import * as route53 from "@aws-cdk/aws-route53";
import * as cdk from "@aws-cdk/core";

interface Props {
  zoneName: string;
}

export class BlitZone extends cdk.Construct {
  readonly zone: route53.PublicHostedZone;

  constructor(parent: cdk.Construct, name: string, props: Props) {
    super(parent, name);
    const { zoneName } = props;

    this.zone = new route53.PublicHostedZone(this, "BlitZone", {
      zoneName,
    });
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
}
