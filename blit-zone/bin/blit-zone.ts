#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import "source-map-support/register";
import { BlitZoneStack } from "../lib/blit-zone-stack";

const app = new cdk.App();
new BlitZoneStack(app, "BlitZoneStack", {
  zoneName: "blit.cc",
});
