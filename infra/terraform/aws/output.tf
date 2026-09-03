output "function_name" {
  description = "Nome da funcao — e o valor que o modulo do API Gateway espera em auth_lambda_name."
  value       = aws_lambda_function.auth.function_name
}

output "function_arn" {
  description = "ARN da funcao."
  value       = aws_lambda_function.auth.arn
}

output "app_base_url" {
  description = "Base URL da aplicacao com que a funcao esta configurada no momento. Util para conferir se o CD da aplicacao ja repassou o hostname real do ELB."
  value       = var.app_base_url
}
