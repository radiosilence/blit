import * as acm from "@aws-cdk/aws-certificatemanager";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as route53 from "@aws-cdk/aws-route53";
import * as cdk from "@aws-cdk/core";
import { Duration } from "@aws-cdk/core";
import { StaticWeb } from "cdk-static-web";

interface Props extends cdk.StackProps {
  domainName: string;
  staticPath: string;
}

export class BlitWebStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, props);
    const { domainName, staticPath } = props;

    const zone = route53.PublicHostedZone.fromLookup(this, "BlitZone", {
      domainName,
    });

    const certificate = new acm.DnsValidatedCertificate(this, "BlitWebCert", {
      domainName,
      hostedZone: zone,
      region: "us-east-1",
    });

    new StaticWeb(this, "Blit", {
      zone,
      certificate,
      staticPath,
      defaultIndexes: true,
      distributionProps: {
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      },
      behaviourOptions: {
        cachePolicy: new cloudfront.CachePolicy(this, "CachePolicy", {
          minTtl: Duration.seconds(1),
          maxTtl: Duration.seconds(31536000),
          defaultTtl: Duration.seconds(86400),
          queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
          headerBehavior: cloudfront.CacheHeaderBehavior.none(),
          cachePolicyName: "CachingWithQueryString",
        }),
      },
      errorPagePath: "/{CODE}/index.html",
    });
  }
}
