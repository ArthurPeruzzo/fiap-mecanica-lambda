variable "function_name" {
  description = "Nome da Function Lambda. Referenciado pelo modulo do API Gateway, no repo da aplicacao (variavel auth_lambda_name)."
  type        = string
  default     = "fiap-mecanica-auth"
}

variable "region_default" {
  default = "us-east-1"
}

variable "tags" {
  default = {
    Name = "fiap-mecanica-terraform"
  }
}

variable "package_path" {
  description = "Caminho do zip gerado por `npm run package`, relativo a este diretorio."
  type        = string
  default     = "../../../build/function.zip"
}

variable "app_base_url" {
  description = <<-EOT
    Base URL da aplicacao fiap-mecanica (sem barra no final) — o ELB publico do Service
    Kubernetes. A Lambda chama GET {app_base_url}/authenticate/cliente/status.

    O hostname do ELB e gerado pela AWS e muda toda vez que o Service e recriado, entao ele NAO
    e conhecido por este repositorio. Quem o mantem em dia e o job `apigw-apply` do CD da
    aplicacao, via `aws lambda update-function-configuration`.

    Para que esse valor nao seja sobrescrito pelo proximo apply daqui, o CD deste repo le o valor
    que ja esta na funcao e o repassa em TF_VAR_app_base_url. O default abaixo so vale na
    primeira criacao, antes de o CD da aplicacao rodar.
  EOT
  type        = string
  default     = "http://placeholder-ate-o-cd-da-aplicacao-definir"
}

variable "jwt_secret" {
  description = "Segredo compartilhado HS256, Base64URL, minimo 32 bytes decodificados. Precisa ser IDENTICO ao JWT_SECRET da aplicacao, senao o token e emitido mas rejeitado pelo filtro dela."
  type        = string
  sensitive   = true
}

variable "jwt_issuer" {
  description = "Claim `iss` do token. Precisa bater com jwt.issuer da aplicacao."
  type        = string
  default     = "mecanica-fiap"
}

variable "token_ttl_hours" {
  description = "Validade do token emitido, em horas. Espelha as 4h da aplicacao."
  type        = number
  default     = 4
}

variable "http_timeout_ms" {
  description = <<-EOT
    Timeout da chamada HTTP a aplicacao. Precisa ser MENOR que o timeout da Lambda, para que ela
    consiga capturar o estouro e responder 504 em vez de ser morta pelo runtime.
    Cadeia: HTTP 15s < Lambda 25s < API Gateway 30s (teto do HTTP API, nao configuravel).
  EOT
  type        = number
  default     = 15000
}

variable "lambda_timeout_seconds" {
  description = "Timeout da funcao. Ver a cadeia descrita em http_timeout_ms."
  type        = number
  default     = 25
}

variable "log_retention_days" {
  description = "Retencao dos logs no CloudWatch. Curta de proposito: ambiente academico, sem requisito de auditoria."
  type        = number
  default     = 7
}
