# Security Scan Report

## Summary
- **Total Issues Found**: 103
- **TFSec Issues**: 0
- **Checkov Issues**: 103

## Detailed Reports
- [TFSec Report](tfsec_report.md)
- [Checkov Report](checkov_report.txt)

## Recommendations
### General Security Recommendations
- Encrypt sensitive data at rest and in transit
- Use IAM roles with least privilege access
- Enable logging and monitoring for all resources
- Implement network security groups with restrictive rules
- Use secure defaults for all resources

### Common Issues to Fix
#### Checkov Findings
- CKV2_AWS_20: "Ensure that ALB redirects HTTP requests into HTTPS ones"
- CKV2_AWS_23: "Route53 A Record has Attached Resource"
- CKV2_AWS_28: "Ensure public facing ALB are protected by WAF"
- CKV2_AWS_32: "Ensure CloudFront distribution has a response headers policy attached"
- CKV2_AWS_42: "Ensure AWS CloudFront distribution uses custom SSL certificate"
- CKV2_AWS_46: "Ensure AWS CloudFront Distribution with S3 have Origin Access set to enabled"
- CKV2_AWS_47: "Ensure AWS CloudFront attached WAFv2 WebACL is configured with AMR for Log4j Vulnerability"
- CKV2_AWS_54: "Ensure AWS CloudFront distribution is using secure SSL protocols for HTTPS communication"
- CKV2_AWS_56: "Ensure AWS Managed IAMFullAccess IAM policy is not used."
- CKV2_AWS_57: "Ensure Secrets Manager secrets should have automatic rotation enabled"
