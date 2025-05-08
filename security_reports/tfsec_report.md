
# [tfsec] Results
## Failed: 35 issue(s)
| # | ID | Severity | Title | Location | Description |
|---|----|----------|-------|----------|-------------|
| 1 | `aws-ec2-add-description-to-security-group-rule` | *LOW* | _Missing description for security group rule._ | `terraform/main.tf:99-104` | Security group rule does not have a description. |
| 2 | `aws-ec2-add-description-to-security-group-rule` | *LOW* | _Missing description for security group rule._ | `terraform/main.tf:161-166` | Security group rule does not have a description. |
| 3 | `aws-ec2-add-description-to-security-group-rule` | *LOW* | _Missing description for security group rule._ | `terraform/main.tf:154-159` | Security group rule does not have a description. |
| 4 | `aws-ec2-add-description-to-security-group-rule` | *LOW* | _Missing description for security group rule._ | `terraform/main.tf:137-142` | Security group rule does not have a description. |
| 5 | `aws-ec2-add-description-to-security-group-rule` | *LOW* | _Missing description for security group rule._ | `terraform/main.tf:130-135` | Security group rule does not have a description. |
| 6 | `aws-ec2-add-description-to-security-group-rule` | *LOW* | _Missing description for security group rule._ | `terraform/main.tf:113-118` | Security group rule does not have a description. |
| 7 | `aws-ec2-add-description-to-security-group-rule` | *LOW* | _Missing description for security group rule._ | `terraform/main.tf:106-111` | Security group rule does not have a description. |
| 8 | `aws-ec2-enable-at-rest-encryption` | *HIGH* | _Instance with unencrypted block device._ | `terraform/main.tf:417-440` | Root block device is not encrypted. |
| 9 | `aws-ec2-enable-at-rest-encryption` | *HIGH* | _Instance with unencrypted block device._ | `terraform/main.tf:390-415` | Root block device is not encrypted. |
| 10 | `aws-ec2-enable-at-rest-encryption` | *HIGH* | _Instance with unencrypted block device._ | `terraform/main.tf:214-236` | Root block device is not encrypted. |
| 11 | `aws-ec2-enable-at-rest-encryption` | *HIGH* | _Instance with unencrypted block device._ | `terraform/main.tf:189-212` | Root block device is not encrypted. |
| 12 | `aws-ec2-enforce-http-token-imds` | *HIGH* | _aws_instance should activate session tokens for Instance Metadata Service._ | `terraform/main.tf:417-440` | Instance does not require IMDS access to require a token |
| 13 | `aws-ec2-enforce-http-token-imds` | *HIGH* | _aws_instance should activate session tokens for Instance Metadata Service._ | `terraform/main.tf:390-415` | Instance does not require IMDS access to require a token |
| 14 | `aws-ec2-enforce-http-token-imds` | *HIGH* | _aws_instance should activate session tokens for Instance Metadata Service._ | `terraform/main.tf:214-236` | Instance does not require IMDS access to require a token |
| 15 | `aws-ec2-enforce-http-token-imds` | *HIGH* | _aws_instance should activate session tokens for Instance Metadata Service._ | `terraform/main.tf:189-212` | Instance does not require IMDS access to require a token |
| 16 | `aws-ec2-no-public-egress-sgr` | *CRITICAL* | _An egress security group rule allows traffic to /0._ | `terraform/main.tf:165` | Security group rule allows egress to multiple public internet addresses. |
| 17 | `aws-ec2-no-public-egress-sgr` | *CRITICAL* | _An egress security group rule allows traffic to /0._ | `terraform/main.tf:141` | Security group rule allows egress to multiple public internet addresses. |
| 18 | `aws-ec2-no-public-egress-sgr` | *CRITICAL* | _An egress security group rule allows traffic to /0._ | `terraform/main.tf:117` | Security group rule allows egress to multiple public internet addresses. |
| 19 | `aws-ec2-no-public-ingress-sgr` | *CRITICAL* | _An ingress security group rule allows traffic from /0._ | `terraform/main.tf:110` | Security group rule allows ingress from public internet. |
| 20 | `aws-ec2-no-public-ingress-sgr` | *CRITICAL* | _An ingress security group rule allows traffic from /0._ | `terraform/main.tf:103` | Security group rule allows ingress from public internet. |
| 21 | `aws-ec2-no-public-ip-subnet` | *HIGH* | _Instances in a subnet should not receive a public IP address by default._ | `terraform/main.tf:39` | Subnet associates public IP address. |
| 22 | `aws-ec2-no-public-ip-subnet` | *HIGH* | _Instances in a subnet should not receive a public IP address by default._ | `terraform/main.tf:28` | Subnet associates public IP address. |
| 23 | `aws-ec2-require-vpc-flow-logs-for-all-vpcs` | *MEDIUM* | _VPC Flow Logs is a feature that enables you to capture information about the IP traffic going to and from network interfaces in your VPC. After you've created a flow log, you can view and retrieve its data in Amazon CloudWatch Logs. It is recommended that VPC Flow Logs be enabled for packet "Rejects" for VPCs._ | `terraform/main.tf:16-21` | VPC Flow Logs is not enabled for VPC  |
| 24 | `aws-elb-alb-not-public` | *HIGH* | _Load balancer is exposed to the internet._ | `terraform/main.tf:265` | Load balancer is exposed publicly. |
| 25 | `aws-elb-drop-invalid-headers` | *HIGH* | _Load balancers should drop invalid headers_ | `terraform/main.tf:263-273` | Application load balancer is not set to drop invalid headers. |
| 26 | `aws-elb-http-not-used` | *CRITICAL* | _Use of plain HTTP._ | `terraform/main.tf:303` | Listener for application load balancer does not use HTTPS. |
| 27 | `aws-s3-block-public-acls` | *HIGH* | _S3 Access block should block public ACL_ | `terraform/main.tf:312-320` | No public access block so not blocking public acls |
| 28 | `aws-s3-block-public-policy` | *HIGH* | _S3 Access block should block public policy_ | `terraform/main.tf:312-320` | No public access block so not blocking public policies |
| 29 | `aws-s3-enable-bucket-encryption` | *HIGH* | _Unencrypted S3 bucket._ | `terraform/main.tf:312-320` | Bucket does not have encryption enabled |
| 30 | `aws-s3-enable-bucket-logging` | *MEDIUM* | _S3 Bucket does not have logging enabled._ | `terraform/main.tf:312-320` | Bucket does not have logging enabled |
| 31 | `aws-s3-enable-versioning` | *MEDIUM* | _S3 Data should be versioned_ | `terraform/main.tf:312-320` | Bucket does not have versioning enabled |
| 32 | `aws-s3-encryption-customer-key` | *HIGH* | _S3 encryption should use Customer Managed Keys_ | `terraform/main.tf:312-320` | Bucket does not encrypt data with a customer managed key. |
| 33 | `aws-s3-ignore-public-acls` | *HIGH* | _S3 Access Block should Ignore Public Acl_ | `terraform/main.tf:312-320` | No public access block so not ignoring public acls |
| 34 | `aws-s3-no-public-buckets` | *HIGH* | _S3 Access block should restrict public bucket to limit access_ | `terraform/main.tf:312-320` | No public access block so not restricting public buckets |
| 35 | `aws-s3-specify-public-access-block` | *LOW* | _S3 buckets should each define an aws_s3_bucket_public_access_block_ | `terraform/main.tf:312-320` | Bucket does not have a corresponding public access block. |

