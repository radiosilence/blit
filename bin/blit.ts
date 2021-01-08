#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import "source-map-support/register";
import { BlitWebStack } from "../lib/blit-web-stack";
import { BlitZoneStack } from "../lib/blit-zone-stack";

const app = new cdk.App();

new BlitWebStack(app, "BlitWebStack", {
  vpsIp: "149.91.89.243",
  zoneName: "blit.cc",
  internal: "xxpk4shiicfjldb50oiasudnas3nd",
  navidromePort: 4533,
});

new BlitZoneStack(app, "BlitZoneStack", {
  zoneName: "blit.cc",
});
