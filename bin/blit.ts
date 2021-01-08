#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import "source-map-support/register";
import { BlitCertStack } from "../lib/blit-cert-stack";
import { BlitWebStack } from "../lib/blit-web-stack";
import { BlitZoneStack } from "../lib/blit-zone-stack";
import { NavidromeStack } from "../lib/navidrome-stack";

const app = new cdk.App();

const env = { account: "339435723451", region: "eu-west-2" };

const domainName = "blit.cc";
const certificateArn = "arn:aws:acm:us-east-1:339435723451:certificate/2ea6c658-2d0a-4717-9362-711dfdc4afe4";

new BlitWebStack(app, "BlitWebStack", {
  domainName,
  certificateArn,
  env,
});

new BlitZoneStack(app, "BlitZoneStack", {
  domainName,
  env,
});

new NavidromeStack(app, "NavidromeStack", {
  domainName,
  certificateArn,
  vpsIp: "149.91.89.243",
  internalRecordName: "xxpk4shiicfjldb50oiasudnas3nd",
  navidromePort: 4533,
  env,
});

new BlitCertStack(app, "BlitCertStack", {
  domainName,
  env,
});
