# Security Scan Report

## Summary
- **Total Issues Found**: 36
- **TFSec Issues**: 0
- **Checkov Issues**: 36

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
- CKV2_AWS_23: "Route53 A Record has Attached Resource"
- CKV2_AWS_5: "Ensure that Security Groups are attached to another resource"
- CKV2_AWS_71: "Ensure AWS ACM Certificate domain name does not include wildcards"
- CKV_AWS_104: "Ensure DocumentDB has audit logs enabled"
- CKV_AWS_182: "Ensure DocumentDB is encrypted by KMS using a customer managed Key (CMK)"
- CKV_AWS_233: "Ensure Create before destroy for ACM certificates"
- CKV_AWS_234: "Verify logging preference for ACM certificates"
- CKV_AWS_23: "Ensure every security group and rule has a description"
- CKV_AWS_24: "Ensure no security groups allow ingress from 0.0.0.0:0 to port 22"
- CKV_AWS_25: "Ensure no security groups allow ingress from 0.0.0.0:0 to port 3389"
