# Segurança do site

Site 100% estático (HTML, CSS e JS próprios): sem backend, sem banco de dados, sem formulários e sem bibliotecas de terceiros. A superfície de ataque é mínima e as camadas abaixo cobrem o que resta.

## Camadas de proteção

| Camada | Onde | Protege contra |
|---|---|---|
| Content Security Policy (CSP) | `<meta>` no `index.html` + cabeçalho HTTP | XSS, scripts/iframes/imagens injetados, exfiltração de dados, phishing via formulário, sequestro de `<base>` |
| Trusted Types (`require-trusted-types-for 'script'`) | CSP | XSS por `innerHTML`, `document.write` e afins |
| `frame-ancestors 'none'` + `X-Frame-Options: DENY` + reforço em JS | cabeçalho HTTP / `script.js` | Clickjacking |
| `Permissions-Policy` | cabeçalho HTTP | Uso indevido de câmera, microfone, localização, pagamento, USB |
| HSTS, `nosniff`, COOP, CORP, `Referrer-Policy` | cabeçalho HTTP | Downgrade para HTTP, MIME sniffing, ataques entre janelas, vazamento de URL |
| `rel="noopener noreferrer"` em links externos | `index.html` | Reverse tabnabbing e vazamento de referer |
| Fontes hospedadas no próprio site | `assets/fonts/` | Dependência de terceiros e envio do IP do visitante ao Google (LGPD) |
| Mapa do Google em iframe com `sandbox`, `referrerpolicy` e carregamento preguiçoso (`loading="lazy"`) | `index.html` | Navegação forçada da página e vazamento de URL pelo mapa |
| Bloqueio de arquivos ocultos, listagem de pastas e métodos de escrita | `.htaccess` | Vazamento de `.git`/`.env`, enumeração de arquivos |

## Privacidade (LGPD)

O mapa do Google Maps carrega sozinho quando o visitante chega perto da seção "Planeje sua visita", sem pedir consentimento antes. A partir desse momento, o Google recebe dados de navegação do visitante (IP e cookies dele). Vale citar o Google Maps na política de privacidade do site.

## Hospedagem

Os cabeçalhos HTTP já estão configurados para:

- **Netlify / Cloudflare Pages:** `_headers`
- **Vercel:** `vercel.json`
- **Apache (Hostinger, cPanel, Locaweb…):** `.htaccess`

**GitHub Pages não permite cabeçalhos personalizados.** Lá continuam valendo a CSP via `<meta>`, os Trusted Types e o anti-clickjacking em JS, mas ficam de fora HSTS com `includeSubDomains`, `Permissions-Policy`, `nosniff`, COOP/CORP e `frame-ancestors`. Para proteção completa, use uma das hospedagens acima ou coloque o domínio atrás do Cloudflare (que também absorve ataques DDoS).

Nunca envie a pasta `.git` para o servidor via FTP.

## Manutenção

- **Script inline:** a CSP libera um único script inline pelo hash SHA-256. Se `document.documentElement.classList.add('js')` no `<head>` for alterado, recalcule o hash e atualize-o em `index.html`, `_headers`, `vercel.json` e `.htaccess`:

  ```sh
  printf %s "document.documentElement.classList.add('js')" | openssl dgst -sha256 -binary | openssl base64
  ```

- **Novos serviços externos** (vídeo incorporado, analytics, formulário) precisam ser liberados na CSP, na diretiva correspondente (`frame-src`, `script-src`, `connect-src`…), nos quatro arquivos.
- **Nunca use** `innerHTML`, `eval` ou `document.write` no JS: os Trusted Types vão bloquear, de propósito.
- **Após publicar**, valide em <https://securityheaders.com> e <https://observatory.mozilla.org>.
