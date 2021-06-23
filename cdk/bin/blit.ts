#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import "source-map-support/register";
import { BlitFilesStack } from "../lib/blit-files.stack";
import { BlitWebStack } from "../lib/blit-web-stack";
import { BlitZoneStack } from "../lib/blit-zone-stack";
import { HttpOriginStack } from "../lib/http-origin-stack";
import { NavidromeECSStack } from "../lib/navidrome-ecs";

const app = new cdk.App();

const env = { account: "339435723451", region: "eu-west-2" };

const domainName = "blit.cc";

new BlitWebStack(app, "BlitCCWebStack", {
  domainName,
  env: {
    ...env,
    region: "us-east-1",
  },
  staticPath: "../web/dist",
});

new BlitZoneStack(app, "BlitZoneStack", {
  domainName,
  env,
});

new HttpOriginStack(app, "NavidromeStack", {
  domainName,
  upstream: {
    addresses: ["149.91.89.243"],
    port: 4533,
  },
  recordName: "nd",
  env,
});

new BlitFilesStack(app, "BlitFilesStack", {
  domainName,
  bucketArn: "arn:aws:s3:::blit-files",
  env,
});

new NavidromeECSStack(app, "NavidromeECSStack", {
  domainName,
  env,
  recordName: "nd-ecs",
});
