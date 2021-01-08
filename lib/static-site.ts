import * as acm from "@aws-cdk/aws-certificatemanager";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as origins from "@aws-cdk/aws-cloudfront-origins";
import * as route53 from "@aws-cdk/aws-route53";
import * as alias from "@aws-cdk/aws-route53-targets";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3deploy from "@aws-cdk/aws-s3-deployment";
import * as cdk from "@aws-cdk/core";

interface Props {
  zoneName: string;
  staticPath: string;
  isSPA?: boolean;
  zone?: route53.PublicHostedZone;
  certificate?: acm.Certificate;
  bucket?: s3.Bucket;
  certificateArn?: string;
  bucketProps?: Partial<s3.BucketProps>;
  certificateProps?: Partial<acm.DnsValidatedCertificateProps>;
  distributionProps?: Partial<cloudfront.DistributionProps>;
  deploymentProps?: Partial<s3deploy.BucketDeploymentProps>;
  behaviourProps?: Partial<cloudfront.BehaviorOptions>;
}

export class StaticSite extends cdk.Construct {
  readonly bucket: s3.Bucket;
  readonly distribution: cloudfront.Distribution;
  readonly record?: route53.ARecord;
  readonly zone: route53.PublicHostedZone;
  readonly certificate: acm.Certificate;
  readonly deployment?: s3deploy.BucketDeployment;

  constructor(parent: cdk.Construct, name: string, props: Props) {
    super(parent, name);
    this.zone = props.zone ?? this.createZone(name, props);

    if (this.zone) {
      this.certificate = props.certificate ?? this.createCertificate(name, props.zoneName, this.zone, props);
    }

    this.bucket = props.bucket ?? this.createBucket(name);

    this.distribution = this.createDistribution(name, this.bucket, props.zoneName, this.certificate, props);

    this.deployment = this.createDeployment(name, this.bucket, this.distribution, props);

    if (this.zone) {
      this.record = this.createARecord(name, this.zone, this.distribution);
    }
  }

  createZone(name: string, { zoneName }: Props) {
    return new route53.PublicHostedZone(this, `${name}Zone`, {
      zoneName,
    });
  }

  createBucket(name: string) {
    return new s3.Bucket(this, `${name}Bucket`);
  }

  createCertificate(name: string, zoneName: string, zone: route53.PublicHostedZone, { certificateProps }: Props) {
    return new acm.DnsValidatedCertificate(this, `${name}Cert`, {
      hostedZone: zone,
      domainName: zoneName,
      region: "us-east-1",
      ...certificateProps,
    });
  }

  createDistribution(
    name: string,
    bucket: s3.Bucket,
    zoneName: string | undefined,
    certificate: acm.Certificate | undefined,
    { distributionProps, behaviourProps: behaviourOptions, isSPA }: Props
  ) {
    const errorResponses = [];
    if (isSPA) {
      errorResponses.push({ httpStatus: 404, responseHttpStatus: 200, responsePagePath: "index.html" });
    }

    return new cloudfront.Distribution(this, `${name}Distribution`, {
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        origin: new origins.S3Origin(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        ...behaviourOptions,
      },
      domainNames: zoneName ? [zoneName] : undefined,
      defaultRootObject: "index.html",
      errorResponses,
      certificate,
      ...distributionProps,
    });
  }

  createDeployment(
    name: string,
    bucket: s3.Bucket,
    distribution: cloudfront.Distribution,
    { staticPath, deploymentProps }: Props
  ) {
    return new s3deploy.BucketDeployment(this, `${name}Deployment`, {
      sources: [s3deploy.Source.asset(staticPath)],
      destinationBucket: bucket,
      distribution,
      ...deploymentProps,
    });
  }

  createARecord(name: string, zone: route53.PublicHostedZone, distribution: cloudfront.Distribution) {
    return new route53.ARecord(this, `${name}ARecord`, {
      zone,
      target: route53.RecordTarget.fromAlias(new alias.CloudFrontTarget(distribution)),
    });
  }
}
