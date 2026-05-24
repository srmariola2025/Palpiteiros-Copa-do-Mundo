# Custom Project Rules

1. **GitHub Workflows and Deployment (`deploy.yml`):**
   - NEVER try to "optimize" or modify the `.github/workflows/deploy.yml` file.
   - NEVER change the caching strategy (`cache: npm`) or replace `npm ci` with other install commands.
   - Keep the file exactly as is to guarantee compatibility with GitHub Pages deployment.

---

# Regras Customizadas do Projeto

1. **Workflows do GitHub e Deploy (`deploy.yml`):**
   - NUNCA tente "otimizar" ou alterar o arquivo `.github/workflows/deploy.yml`.
   - NUNCA mude a estratégia de cache (`cache: npm`) ou substitua o comando `npm ci` por outros comandos de instalação.
   - Mantenha o arquivo exatamente como está para garantir compatibilidade com o deploy do GitHub Pages.
