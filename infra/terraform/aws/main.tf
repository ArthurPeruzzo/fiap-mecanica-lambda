# Function Lambda de autenticacao de cliente por CPF (Fase 3).
#
# Este modulo cria SOMENTE a funcao e seu log group. A rota que a expoe
# (`POST /auth/cliente`) vive no API Gateway, que fica no repositorio da aplicacao
# (`fiap-mecanica/infra/terraform/apigateway`) e referencia esta funcao por nome.
#
# Cada repositorio publica o que e seu: aqui a funcao, la a rota.

# A conta AWS Academy Lab nao permite criar IAM roles proprias, entao a execution role e a
# LabRole ja existente — mesmo padrao usado pelo EKS no repositorio da aplicacao.
data "aws_iam_role" "lab_role" {
  name = "LabRole"
}

# Criado explicitamente (em vez de deixar a Lambda criar sob demanda) para poder definir a
# retencao. Um log group criado implicitamente pela Lambda nunca expira.
resource "aws_cloudwatch_log_group" "auth" {
  name              = "/aws/lambda/${var.function_name}"
  retention_in_days = var.log_retention_days
  tags              = var.tags
}

resource "aws_lambda_function" "auth" {
  function_name = var.function_name
  description   = "Autentica cliente por CPF e emite JWT aceito pelo filtro da aplicacao fiap-mecanica"

  role    = data.aws_iam_role.lab_role.arn
  runtime = "nodejs22.x"
  handler = "handler.handler"

  # Bundle unico gerado por `npm run package` (esbuild). O source_code_hash faz o Terraform
  # detectar mudanca de codigo — sem ele, um zip novo com o mesmo caminho nao dispara update.
  filename         = var.package_path
  source_code_hash = filebase64sha256(var.package_path)

  timeout     = var.lambda_timeout_seconds
  memory_size = 256

  # Sem `vpc_config` de proposito: a funcao precisa alcancar o ELB publico da aplicacao, e a VPC
  # do projeto so tem subnets publicas, sem NAT gateway. Dentro da VPC, a Lambda ficaria sem
  # rota para a internet e nao conseguiria fazer a chamada HTTP.

  environment {
    variables = {
      APP_BASE_URL    = var.app_base_url
      JWT_SECRET      = var.jwt_secret
      JWT_ISSUER      = var.jwt_issuer
      TOKEN_TTL_HOURS = tostring(var.token_ttl_hours)
      HTTP_TIMEOUT_MS = tostring(var.http_timeout_ms)
    }
  }

  tags = var.tags

  depends_on = [aws_cloudwatch_log_group.auth]
}
