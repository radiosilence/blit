#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { BlitStack } from '../lib/blit-stack';

const app = new cdk.App();
new BlitStack(app, 'BlitStack');
