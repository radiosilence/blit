import * as acm from "@aws-cdk/aws-certificatemanager";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as origins from "@aws-cdk/aws-cloudfront-origins";
import * as iam from "@aws-cdk/aws-iam";
import * as route53 from "@aws-cdk/aws-route53";
import * as alias from "@aws-cdk/aws-route53-targets";
import * as s3 from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";

interface Props extends cdk.StackProps {
  domainName: string;
  bucketArn: string;
  recordName?: string;
}

export class BlitFilesStack extends cdk.Stack {
  constructor(parent: cdk.Construct, name: string, props: Props) {
    super(parent, name, props);
    // BlitFiles
    const { domainName, recordName = "files", bucketArn } = props;

    const zone = route53.PublicHostedZone.fromLookup(this, "BlitZone", {
      domainName,
    });

    const fullDomainName = `${recordName}.${domainName}`;

    const certificate = new acm.DnsValidatedCertificate(this, "BlitFilesCert", {
      domainName: fullDomainName,
      hostedZone: zone,
      region: "us-east-1",
    });

    const bucket = s3.Bucket.fromBucketArn(this, "FilesBucket", bucketArn);

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, `OriginAccessIdentity`);

    const statement = new iam.PolicyStatement();

    statement.addActions("s3:GetBucket*", "s3:GetObject*", "s3:List*");
    statement.addResources(bucket.bucketArn, `${bucket.bucketArn}/*`);
    statement.addCanonicalUserPrincipal(originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId);

    bucket.addToResourcePolicy(statement);

    new cdk.CfnOutput(this, "Statement", {
      value: JSON.stringify(statement.toJSON(), null, 2),
    });

    new cdk.CfnOutput(this, "OriginAccessIdentityName", {
      value: originAccessIdentity.originAccessIdentityName,
    });

    new cdk.CfnOutput(this, "BucketPolicy", {
      value: `${bucket.policy}`,
    });

    const distribution = new cloudfront.Distribution(this, "BlitFilesDistribution", {
      certificate,
      domainNames: [fullDomainName],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        origin: new origins.S3Origin(bucket, { originAccessIdentity }),
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        smoothStreaming: true,
      },
    });

    new route53.ARecord(this, "BlitFilesRecord", {
      zone,
      recordName,
      target: route53.RecordTarget.fromAlias(new alias.CloudFrontTarget(distribution)),
    });
  }
}
