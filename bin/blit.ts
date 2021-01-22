#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import "source-map-support/register";
import { BlitCertStack } from "../lib/blit-cert-stack";
import { BlitFilesStack } from "../lib/blit-files.stack";
import { BlitWebStack } from "../lib/blit-web-stack";
import { BlitZoneStack } from "../lib/blit-zone-stack";
import { NavidromeStack } from "../lib/navidrome-stack";

const app = new cdk.App();

const env = { account: "339435723451", region: "eu-west-2" };

const domainName = "blit.cc";

new BlitWebStack(app, "BlitWebStack", {
  domainName,
  env,
});

new BlitZoneStack(app, "BlitZoneStack", {
  domainName,
  env,
});

new NavidromeStack(app, "NavidromeStack", {
  domainName,
  vpsIp: "149.91.89.243",
  internalRecordName: "xxpk4shiicfjldb50oiasudnas3nd",
  navidromePort: 4533,
  env,
});

new BlitFilesStack(app, "BlitFilesStack", {
  domainName,
  bucketArn: "arn:aws:s3:::blit-files",
  env,
});

new BlitCertStack(app, "BlitCertStack", {
  domainName,
  env,
});
