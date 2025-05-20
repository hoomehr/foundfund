
# [tfsec] Results
## Failed: 33 issue(s)
| # | ID | Severity | Title | Location | Description |
|---|----|----------|-------|----------|-------------|
| 1 | `aws-cloudwatch-log-group-customer-key` | *LOW* | _CloudWatch log groups should be encrypted using CMK_ | `terraform/main.tf:332-336` | Log group is not encrypted. |
| 2 | `aws-documentdb-enable-log-export` | *MEDIUM* | _DocumentDB logs export should be enabled_ | `terraform/main.tf:516-530` | Neither CloudWatch audit nor profiler log exports are enabled. |
| 3 | `aws-documentdb-enable-storage-encryption` | *HIGH* | _DocumentDB storage must be encrypted_ | `terraform/main.tf:516-530` | Cluster storage does not have encryption enabled. |
| 4 | `aws-documentdb-encryption-customer-key` | *LOW* | _DocumentDB encryption should use Customer Managed Keys_ | `terraform/main.tf:532-540` | Instance encryption does not use a customer-managed KMS key. |
| 5 | `aws-documentdb-encryption-customer-key` | *LOW* | _DocumentDB encryption should use Customer Managed Keys_ | `terraform/main.tf:532-540` | Instance encryption does not use a customer-managed KMS key. |
| 6 | `aws-documentdb-encryption-customer-key` | *LOW* | _DocumentDB encryption should use Customer Managed Keys_ | `terraform/main.tf:516-530` | Cluster encryption does not use a customer-managed KMS key. |
| 7 | `aws-ec2-add-description-to-security-group-rule` | *LOW* | _Missing description for security group rule._ | `terraform/main.tf:254-259` | Security group rule does not have a description. |
| 8 | `aws-ec2-add-description-to-security-group-rule` | *LOW* | _Missing description for security group rule._ | `terraform/main.tf:248-253` | Security group rule does not have a description. |
| 9 | `aws-ec2-add-description-to-security-group-rule` | *LOW* | _Missing description for security group rule._ | `terraform/main.tf:233-238` | Security group rule does not have a description. |
| 10 | `aws-ec2-add-description-to-security-group-rule` | *LOW* | _Missing description for security group rule._ | `terraform/main.tf:227-232` | Security group rule does not have a description. |
| 11 | `aws-ec2-add-description-to-security-group-rule` | *LOW* | _Missing description for security group rule._ | `terraform/main.tf:212-217` | Security group rule does not have a description. |
| 12 | `aws-ec2-add-description-to-security-group-rule` | *LOW* | _Missing description for security group rule._ | `terraform/main.tf:206-211` | Security group rule does not have a description. |
| 13 | `aws-ec2-add-description-to-security-group-rule` | *LOW* | _Missing description for security group rule._ | `terraform/main.tf:200-205` | Security group rule does not have a description. |
| 14 | `aws-ec2-no-public-egress-sgr` | *CRITICAL* | _An egress security group rule allows traffic to /0._ | `terraform/main.tf:258` | Security group rule allows egress to multiple public internet addresses. |
| 15 | `aws-ec2-no-public-egress-sgr` | *CRITICAL* | _An egress security group rule allows traffic to /0._ | `terraform/main.tf:237` | Security group rule allows egress to multiple public internet addresses. |
| 16 | `aws-ec2-no-public-egress-sgr` | *CRITICAL* | _An egress security group rule allows traffic to /0._ | `terraform/main.tf:216` | Security group rule allows egress to multiple public internet addresses. |
| 17 | `aws-ec2-no-public-ingress-sgr` | *CRITICAL* | _An ingress security group rule allows traffic from /0._ | `terraform/main.tf:210` | Security group rule allows ingress from public internet. |
| 18 | `aws-ec2-no-public-ingress-sgr` | *CRITICAL* | _An ingress security group rule allows traffic from /0._ | `terraform/main.tf:204` | Security group rule allows ingress from public internet. |
| 19 | `aws-ec2-require-vpc-flow-logs-for-all-vpcs` | *MEDIUM* | _VPC Flow Logs is a feature that enables you to capture information about the IP traffic going to and from network interfaces in your VPC. After you've created a flow log, you can view and retrieve its data in Amazon CloudWatch Logs. It is recommended that VPC Flow Logs be enabled for packet "Rejects" for VPCs._ | `terraform-aws-modules/vpc/aws/main.tf:28-51` | VPC Flow Logs is not enabled for VPC  |
| 20 | `aws-ecr-enforce-immutable-repository` | *HIGH* | _ECR images tags shouldn't be mutable._ | `terraform/main.tf:268` | Repository tags are mutable. |
| 21 | `aws-ecr-repository-customer-key` | *LOW* | _ECR Repository should use customer managed keys to allow more control_ | `terraform/main.tf:266-275` | Repository is not encrypted using KMS. |
| 22 | `aws-ecs-enable-container-insight` | *LOW* | _ECS clusters should have container insights enabled_ | `terraform/main.tf:280-283` | Cluster does not have container insights enabled. |
| 23 | `aws-elb-alb-not-public` | *HIGH* | _Load balancer is exposed to the internet._ | `terraform/main.tf:384` | Load balancer is exposed publicly. |
| 24 | `aws-elb-drop-invalid-headers` | *HIGH* | _Load balancers should drop invalid headers_ | `terraform/main.tf:382-391` | Application load balancer is not set to drop invalid headers. |
| 25 | `aws-s3-block-public-acls` | *HIGH* | _S3 Access block should block public ACL_ | `terraform/main.tf:564` | Public access block does not block public ACLs |
| 26 | `aws-s3-block-public-policy` | *HIGH* | _S3 Access block should block public policy_ | `terraform/main.tf:565` | Public access block does not block public policies |
| 27 | `aws-s3-enable-bucket-encryption` | *HIGH* | _Unencrypted S3 bucket._ | `terraform/main.tf:545-548` | Bucket does not have encryption enabled |
| 28 | `aws-s3-enable-bucket-logging` | *MEDIUM* | _S3 Bucket does not have logging enabled._ | `terraform/main.tf:545-548` | Bucket does not have logging enabled |
| 29 | `aws-s3-enable-versioning` | *MEDIUM* | _S3 Data should be versioned_ | `terraform/main.tf:545-548` | Bucket does not have versioning enabled |
| 30 | `aws-s3-encryption-customer-key` | *HIGH* | _S3 encryption should use Customer Managed Keys_ | `terraform/main.tf:545-548` | Bucket does not encrypt data with a customer managed key. |
| 31 | `aws-s3-ignore-public-acls` | *HIGH* | _S3 Access Block should Ignore Public Acl_ | `terraform/main.tf:566` | Public access block does not ignore public ACLs |
| 32 | `aws-s3-no-public-buckets` | *HIGH* | _S3 Access block should restrict public bucket to limit access_ | `terraform/main.tf:567` | Public access block does not restrict public buckets |
| 33 | `aws-ssm-secret-use-customer-key` | *LOW* | _Secrets Manager should use customer managed keys_ | `terraform/main.tf:492-496` | Secret explicitly uses the default key. |

