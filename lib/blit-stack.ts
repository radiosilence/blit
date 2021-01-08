import * as cdk from "@aws-cdk/core";
import { BlitStatic } from "./blit-static";
import { BlitZone } from "./blit-zone";
import { Navidrome } from "./navidrome";

interface BlitStackProps extends cdk.StackProps {
  vpsIp: string;
  zoneName: string;
  internal: string;
  navidromePort: number;
}

const zoneExists = false;

export class BlitStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: BlitStackProps) {
    super(scope, id, props);
    const { zoneName } = props;

    const { zone } = new BlitZone(this, "Blit", {
      zoneName,
    });

    if (zoneExists) {
      new BlitStatic(this, "Static", { zone });

      new Navidrome(this, "Navidrome", {
        rootZoneName: zoneName,
        internalRecordName: props.internal,
        navidromePort: props.navidromePort,
        vpsIp: props.vpsIp,
        zone,
      });
    }
  }
}
