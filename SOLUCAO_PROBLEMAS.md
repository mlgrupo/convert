# 🔧 Solução de Problemas - Google Drive

## Problema: "File not found" mesmo com arquivo existente

### Possíveis Causas e Soluções:

#### 1. **Domain Wide Delegation não configurado**
- **Problema**: Service account não tem permissões de domínio
- **Solução**: Configure o Domain Wide Delegation no Google Workspace Admin

#### 2. **Email de Impersonation Incorreto**
- **Problema**: Sistema tentando acessar com email errado
- **Solução**: Verifique se o `.env` tem:
  ```env
  GOOGLE_USER_EMAIL=leonardorosso@reconectaoficial.com.br
  ```

#### 3. **Escopo incorreto no Domain Wide Delegation**
- **Problema**: Escopo não permite acesso ao Drive
- **Solução**: Adicione o escopo correto no Google Workspace Admin

#### 4. **Service account sem permissões**
- **Problema**: Service account não tem permissões adequadas
- **Solução**: Verifique se a service account tem acesso ao Google Drive

### Como Testar:

```bash
# Teste de Domain Wide Delegation
node test-domain-delegation.js

# Teste de permissões gerais
node test-permissions.js

# Teste completo do Google Drive
node test-google-drive.js
```

### Configuração do Domain Wide Delegation:

#### 1. **No Google Workspace Admin Console:**
1. Acesse: https://admin.google.com
2. Vá para **Segurança** > **Contas de serviço**
3. Selecione sua service account
4. Clique em **Editar**
5. Em **Domain-wide delegation**, clique em **Adicionar novo**
6. Adicione o escopo: `https://www.googleapis.com/auth/drive`
7. Salve as alterações

#### 2. **Verificar configuração:**
```bash
node test-domain-delegation.js
```

### Verificações Importantes:

1. **Domain Wide Delegation ativo?**
   - Verifique no Google Workspace Admin
   - Confirme se o escopo está correto

2. **Email de impersonation correto?**
   - Verifique o arquivo `.env`
   - Confirme se é `leonardorosso@reconectaoficial.com.br`

3. **Service account ativa?**
   - Verifique se a service account não foi desabilitada
   - Confirme se as credenciais estão corretas

4. **Arquivo existe?**
   - Acesse diretamente no Google Drive
   - Verifique se não está na lixeira

### Logs de Debug:

O sistema agora mostra informações detalhadas:
- ✅ **Token de acesso** gerado
- ✅ **Claims do JWT** usados
- ✅ **Email de impersonation** ativo
- ✅ **Domain Wide Delegation** status
- ✅ **Detalhes do arquivo** encontrado
- ✅ **Proprietários** e permissões

### Exemplo de Configuração Completa:

#### 1. **Arquivo `.env`:**
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=seu-service@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_USER_EMAIL=leonardorosso@reconectaoficial.com.br
```

#### 2. **Google Workspace Admin:**
- Service Account habilitada
- Domain Wide Delegation ativo
- Escopo: `https://www.googleapis.com/auth/drive`

#### 3. **Teste:**
```bash
node test-domain-delegation.js
```

### Teste Rápido:

```bash
# Execute este comando para verificar Domain Wide Delegation
node test-domain-delegation.js
```

### Erros Comuns e Soluções:

#### **"invalid_grant"**
- **Causa**: Domain Wide Delegation não configurado
- **Solução**: Configure no Google Workspace Admin

#### **"File not found"**
- **Causa**: Email de impersonation incorreto
- **Solução**: Verifique `GOOGLE_USER_EMAIL` no `.env`

#### **"insufficient_scope"**
- **Causa**: Escopo incorreto no Domain Wide Delegation
- **Solução**: Adicione `https://www.googleapis.com/auth/drive`

### Fluxo de Solução:

1. **Execute o teste de Domain Wide Delegation:**
   ```bash
   node test-domain-delegation.js
   ```

2. **Se falhar na geração de token:**
   - Configure Domain Wide Delegation no Google Workspace Admin
   - Adicione o escopo correto

3. **Se falhar no acesso ao arquivo:**
   - Verifique o email de impersonation
   - Confirme se o arquivo existe

4. **Se tudo passar:**
   - Domain Wide Delegation está funcionando!
   - A API deve funcionar normalmente

### Comandos Úteis:

```bash
# Teste completo
node test-domain-delegation.js

# Teste específico de permissões
node test-permissions.js

# Teste da API
npm start
```

Se ainda não funcionar, verifique:
- Se o Domain Wide Delegation está configurado corretamente
- Se o email de impersonation está correto
- Se a service account tem permissões adequadas
- Se o arquivo realmente existe no Google Drive 