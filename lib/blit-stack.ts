import * as route53 from "@aws-cdk/aws-route53";
import * as cdk from "@aws-cdk/core";

const vpsHost = "149.91.89.243";
const zoneName = "blit.cc";

export class BlitStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const zone = new route53.PublicHostedZone(this, "BlitCC", {
      zoneName,
    });

    const vpsTarget = route53.RecordTarget.fromIpAddresses(vpsHost);

    new route53.ARecord(this, "BlitRoot", {
      zone,
      target: vpsTarget,
    });

    new route53.ARecord(this, "BlitWildcard", {
      zone,
      recordName: "*",
      target: vpsTarget,
    });

    new route53.TxtRecord(this, "BlitSPF", {
      zone,
      values: ["v=spf1 include:spf.messagingengine.com ?all", "hi mum"],
    });

    new route53.MxRecord(this, "MXRecord10", {
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
  }
}
