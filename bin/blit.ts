#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import "source-map-support/register";
import { BlitStack } from "../lib/blit-stack";

const app = new cdk.App();
new BlitStack(app, "BlitStack", {
  vpsHost: "149.91.89.243",
  zoneName: "blit.cc",
  internal: "xxpk4shiicfjldb50oiasudnas3nd",
  navidromePort: 4533,
  useCloudFront: true,

  env: {
    region: "us-east-1",
    account: "339435723451",
  },
});
