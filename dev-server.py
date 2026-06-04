#!/usr/bin/env python3
"""
dev-server.py — servidor local de desenvolvimento para o ABCL.

Igual ao `python -m http.server 8080`, MAS envia cabeçalhos que mandam o
navegador NUNCA cachear os arquivos. Resolve o problema de "funciona só com
o DevTools aberto" — que acontece porque, sem esses cabeçalhos, o Chrome
serve uma versão antiga do cache quando o DevTools (com 'Disable cache') está fechado.

Uso (na pasta do projeto):
    python dev-server.py
    # depois abra http://localhost:8080/vendinha.html

Para parar: Ctrl+C
"""
import http.server
import socketserver

PORTA = 8080


class SemCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Força o navegador a sempre buscar a versão mais recente
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()


if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('', PORTA), SemCacheHandler) as httpd:
        print(f'Servidor SEM cache rodando em http://localhost:{PORTA}/')
        print('Abra http://localhost:%d/vendinha.html  (Ctrl+C para parar)' % PORTA)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nServidor encerrado.')
