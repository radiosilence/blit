import * as acm from "@aws-cdk/aws-certificatemanager";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as origins from "@aws-cdk/aws-cloudfront-origins";
import * as route53 from "@aws-cdk/aws-route53";
import * as alias from "@aws-cdk/aws-route53-targets";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3deploy from "@aws-cdk/aws-s3-deployment";
import * as cdk from "@aws-cdk/core";

interface Props {
  staticPath: string;
  isSPA?: boolean;
  certificate?: acm.ICertificate;
  zone?: route53.IHostedZone;
  bucket?: s3.IBucket;
  distributionProps?: Partial<cloudfront.DistributionProps>;
  deploymentProps?: Partial<s3deploy.BucketDeploymentProps>;
  behaviourProps?: Partial<cloudfront.BehaviorOptions>;
}

export class StaticSite extends cdk.Construct {
  readonly bucket: s3.IBucket;
  readonly distribution: cloudfront.Distribution;
  readonly record?: route53.ARecord;
  readonly deployment?: s3deploy.BucketDeployment;

  constructor(parent: cdk.Construct, name: string, props: Props) {
    super(parent, name);
    const { zone, certificate } = props;

    this.bucket = props.bucket ?? this.createBucket();
    this.distribution = this.createDistribution(this.bucket, zone?.zoneName, certificate, props);
    this.deployment = this.createDeployment(this.bucket, this.distribution, props);

    if (zone) {
      this.record = this.createARecord(zone, this.distribution);
    }
  }

  createBucket() {
    return new s3.Bucket(this, `Bucket`);
  }

  createDistribution(
    bucket: s3.IBucket,
    zoneName: string | undefined,
    certificate: acm.ICertificate | undefined,
    { distributionProps, behaviourProps, isSPA }: Props
  ) {
    const errorResponses = [];
    if (isSPA) {
      errorResponses.push({ httpStatus: 404, responseHttpStatus: 200, responsePagePath: "index.html" });
    }

    return new cloudfront.Distribution(this, `Distribution`, {
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        origin: new origins.S3Origin(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        ...behaviourProps,
      },
      domainNames: zoneName ? [zoneName] : undefined,
      defaultRootObject: "index.html",
      errorResponses,
      certificate,
      ...distributionProps,
    });
  }

  createDeployment(bucket: s3.IBucket, distribution: cloudfront.IDistribution, { staticPath, deploymentProps }: Props) {
    return new s3deploy.BucketDeployment(this, `Deployment`, {
      sources: [s3deploy.Source.asset(staticPath)],
      destinationBucket: bucket,
      distribution,
      ...deploymentProps,
    });
  }

  createARecord(zone: route53.IHostedZone, distribution: cloudfront.IDistribution) {
    return new route53.ARecord(this, `ARecord`, {
      zone,
      target: route53.RecordTarget.fromAlias(new alias.CloudFrontTarget(distribution)),
    });
  }
}
