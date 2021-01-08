#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import "source-map-support/register";
import { BlitWebStack } from "../lib/blit-web-stack";

const app = new cdk.App();

new BlitWebStack(app, "BlitStack", {
  vpsIp: "149.91.89.243",
  zoneName: "blit.cc",
  internal: "xxpk4shiicfjldb50oiasudnas3nd",
  navidromePort: 4533,
  env: {
    region: "us-east-1",
    account: "339435723451",
  },
});
