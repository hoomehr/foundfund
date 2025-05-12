
# [tfsec] Results
## Failed: 17 issue(s)
| # | ID | Severity | Title | Location | Description |
|---|----|----------|-------|----------|-------------|
| 1 | `aws-documentdb-enable-log-export` | *MEDIUM* | _DocumentDB logs export should be enabled_ | `terraform/main.tf:278-296` | Neither CloudWatch audit nor profiler log exports are enabled. |
| 2 | `aws-documentdb-encryption-customer-key` | *LOW* | _DocumentDB encryption should use Customer Managed Keys_ | `terraform/main.tf:298-309` | Instance encryption does not use a customer-managed KMS key. |
| 3 | `aws-documentdb-encryption-customer-key` | *LOW* | _DocumentDB encryption should use Customer Managed Keys_ | `terraform/main.tf:298-309` | Instance encryption does not use a customer-managed KMS key. |
| 4 | `aws-documentdb-encryption-customer-key` | *LOW* | _DocumentDB encryption should use Customer Managed Keys_ | `terraform/main.tf:278-296` | Cluster encryption does not use a customer-managed KMS key. |
| 5 | `aws-ec2-add-description-to-security-group-rule` | *LOW* | _Missing description for security group rule._ | `terraform/main.tf:234-239` | Security group rule does not have a description. |
| 6 | `aws-ec2-add-description-to-security-group-rule` | *LOW* | _Missing description for security group rule._ | `terraform/main.tf:227-232` | Security group rule does not have a description. |
| 7 | `aws-ec2-add-description-to-security-group-rule` | *LOW* | _Missing description for security group rule._ | `terraform/main.tf:209-214` | Security group rule does not have a description. |
| 8 | `aws-ec2-add-description-to-security-group-rule` | *LOW* | _Missing description for security group rule._ | `terraform/main.tf:194-199` | Security group rule does not have a description. |
| 9 | `aws-ec2-add-description-to-security-group-rule` | *LOW* | _Missing description for security group rule._ | `terraform/main.tf:175-180` | Security group rule does not have a description. |
| 10 | `aws-ec2-add-description-to-security-group-rule` | *LOW* | _Missing description for security group rule._ | `terraform/main.tf:168-173` | Security group rule does not have a description. |
| 11 | `aws-ec2-add-description-to-security-group-rule` | *LOW* | _Missing description for security group rule._ | `terraform/main.tf:161-166` | Security group rule does not have a description. |
| 12 | `aws-ec2-no-public-egress-sgr` | *CRITICAL* | _An egress security group rule allows traffic to /0._ | `terraform/main.tf:238` | Security group rule allows egress to multiple public internet addresses. |
| 13 | `aws-ec2-no-public-egress-sgr` | *CRITICAL* | _An egress security group rule allows traffic to /0._ | `terraform/main.tf:213` | Security group rule allows egress to multiple public internet addresses. |
| 14 | `aws-ec2-no-public-egress-sgr` | *CRITICAL* | _An egress security group rule allows traffic to /0._ | `terraform/main.tf:179` | Security group rule allows egress to multiple public internet addresses. |
| 15 | `aws-ec2-no-public-ingress-sgr` | *CRITICAL* | _An ingress security group rule allows traffic from /0._ | `terraform/main.tf:172` | Security group rule allows ingress from public internet. |
| 16 | `aws-ec2-no-public-ingress-sgr` | *CRITICAL* | _An ingress security group rule allows traffic from /0._ | `terraform/main.tf:165` | Security group rule allows ingress from public internet. |
| 17 | `aws-ec2-require-vpc-flow-logs-for-all-vpcs` | *MEDIUM* | _VPC Flow Logs is a feature that enables you to capture information about the IP traffic going to and from network interfaces in your VPC. After you've created a flow log, you can view and retrieve its data in Amazon CloudWatch Logs. It is recommended that VPC Flow Logs be enabled for packet "Rejects" for VPCs._ | `terraform-aws-modules/vpc/aws/main.tf:29-52` | VPC Flow Logs is not enabled for VPC  |

