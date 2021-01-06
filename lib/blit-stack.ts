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

    new route53.ARecord(this, "ARecordRoot", {
      zone,
      target: route53.RecordTarget.fromIpAddresses(vpsHost),
    });

    // Fastmail
    new route53.TxtRecord(this, "TXTDKIMRecord", {
      zone,
      recordName: "_foo",
      values: [
        "v=DKIM1;",
        "k=rsa;",
        "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC2NO/nGVUbJSNhqQMytu1tHoKNKOSV+HmgR8K9y0Q+/4TUgfwReBLeZYHsuWa697vY3qROU1KSxYQ0uuu0DamOitlKqJabqyuFcR85HDFoQjQM5+yTPoe+3K8Q1fmFk+W887YF1taZb1u70M4ZF6q8NxM+CQdoE/Mx+G+WEMefgwIDAQAB",
      ],
    });

    new route53.TxtRecord(this, "TXTSPFRecord", {
      zone,
      values: ["v=spf1", "include:spf.messagingengine.com", "?all"],
    });

    new route53.MxRecord(this, "MXRecord10", {
      zone,
      values: [
        { priority: 10, hostName: "in1-smtp.messagingengine.com." },
        { priority: 20, hostName: "in2-smtp.messagingengine.com." },
      ],
    });

    for (const n of [1, 2, 3]) {
      new route53.CnameRecord(this, `CNameFM${n}`, {
        zone,
        recordName: `fm${n}.domainkey`,
        domainName: `fm${n}.blit.cc.dkim.fmhosted.com.`,
      });
    }

    new route53.CnameRecord(this, "CNameMeSMTP", {
      zone,
      recordName: "mesmtp._domainkey",
      domainName: "mesmtp.blit.cc.dkim.fmhosted.com.",
    });
  }
}
