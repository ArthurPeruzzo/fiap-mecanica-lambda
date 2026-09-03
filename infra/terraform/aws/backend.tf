terraform {
  backend "s3" {
    bucket = "fiap-mecanica"
    key    = "tfstate/lambda.tfstate"
    region = "us-east-1"
  }
}
