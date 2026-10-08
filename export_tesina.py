#!/usr/bin/env python3
"""
Compilador de Tesina / Monografía Técnica para Burger 24/7
Une todos los capítulos de la carpeta docs/ en un documento unificado
TESINA_COMPLETA.md y genera una versión imprimible profesional TESINA_COMPLETA.html
con soporte para exportación a PDF (Ctrl + P en cualquier navegador).
"""

import os
import re
import sys
from datetime import datetime

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DOCS_DIR = os.path.join(ROOT_DIR, "docs")
OUT_MD = os.path.join(ROOT_DIR, "TESINA_COMPLETA.md")
OUT_HTML = os.path.join(ROOT_DIR, "TESINA_COMPLETA.html")

DOC_ORDER = [
    ("Capítulo 1: Infraestructura, Arquitectura y Despliegue", "tesina_infrastructure.md"),
    ("Capítulo 2: Diagramas del Sistema y Modelado C4", "tesina_diagrams.md"),
    ("Capítulo 3: Arquitectura de Seguridad y Criptografía", "tesina_security.md"),
    ("Capítulo 4: Transacciones, Máquinas de Estados y Reglas de Negocio", "tesina_transactions.md"),
    ("Capítulo 4.1: Módulo Crítico de Rendimiento en C++ (SPEC §2)", "modulo_critico_cpp.md"),
    ("Capítulo 5: Manual de Integración Frontend-Backend y Catálogo de APIs", "tesina_integration.md"),
    ("Capítulo 6: Interfaz de Usuario y Componentes Frontend", "tesina_frontend.md"),
    ("Capítulo 7: Manual de Usuario, Pruebas Operativas y Conclusiones", "tesina_manual_conclusion.md")
]

def compile_markdown():
    combined_lines = []
    
    # Portada académica
    combined_lines.append("# MONOGRAFÍA Y TESINA TÉCNICA DE GRADO")
    combined_lines.append("## Sistema E-commerce y Plataforma de Logística en Tiempo Real Burger 24/7\n")
    combined_lines.append("**Proyecto:** Burger 24/7 - Plataforma E-Commerce Multi-Actor con Arquitectura de Microservicios\n")
    combined_lines.append(f"**Fecha de Compilación:** {datetime.now().strftime('%d/%m/%Y')}\n")
    combined_lines.append("**Versión de Documentación:** 1.0.1 (Revisión Final de Integración)\n")
    combined_lines.append("---\n")
    
    # Índice
    combined_lines.append("## Tabla de Contenido General\n")
    for i, (title, filename) in enumerate(DOC_ORDER, 1):
        combined_lines.append(f"{i}. [{title}](#{title.lower().replace(' ', '-').replace(':', '').replace(',', '')})")
    combined_lines.append("\n---\n")

    for title, filename in DOC_ORDER:
        filepath = os.path.join(DOCS_DIR, filename)
        if not os.path.exists(filepath):
            print(f"[ALERTA] Archivo no encontrado: {filepath}")
            continue
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        combined_lines.append(f"\n\n<!-- PAGE_BREAK -->\n\n# {title}\n")
        combined_lines.append(content)
        combined_lines.append("\n\n---\n")

    master_md = "\n".join(combined_lines)
    with open(OUT_MD, 'w', encoding='utf-8') as f:
        f.write(master_md)
    print(f"[OK] Archivo Markdown unificado generado: {OUT_MD}")
    return master_md

def generate_html(markdown_content):
    # Generar versión HTML enriquecida para impresión con Marked.js y Mermaid.js
    escaped_md = markdown_content.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")
    
    html_template = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tesina Técnica - Burger 24/7 E-Commerce</title>
    <!-- Marked.js para renderizado en cliente -->
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <!-- Mermaid para diagramas interactivos -->
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        
        :root {{
            --primary: #d97706;
            --primary-dark: #b45309;
            --bg: #ffffff;
            --text: #1f2937;
            --border: #e5e7eb;
            --code-bg: #f8fafc;
        }}
        
        * {{
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: var(--text);
            background-color: #f3f4f6;
            line-height: 1.7;
            margin: 0;
            padding: 20px;
        }}
        
        .no-print-bar {{
            max-width: 900px;
            margin: 0 auto 20px auto;
            background: #1e293b;
            color: #fff;
            padding: 16px 24px;
            border-radius: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }}
        
        .no-print-bar button {{
            background: #f59e0b;
            color: #111827;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
            transition: background 0.2s;
        }}
        .no-print-bar button:hover {{
            background: #d97706;
            color: #fff;
        }}
        
        .doc-container {{
            max-width: 900px;
            margin: 0 auto;
            background: var(--bg);
            padding: 60px 80px;
            border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.08);
        }}
        
        h1, h2, h3, h4, h5, h6 {{
            color: #111827;
            font-weight: 700;
            margin-top: 1.8em;
            margin-bottom: 0.6em;
            line-height: 1.3;
        }}
        
        h1 {{
            font-size: 2.2rem;
            border-bottom: 2px solid var(--primary);
            padding-bottom: 12px;
            margin-top: 2.5em;
        }}
        
        .doc-container > h1:first-of-type {{
            margin-top: 0;
            font-size: 2.5rem;
            text-align: center;
            border-bottom: none;
        }}
        
        h2 {{
            font-size: 1.6rem;
            color: var(--primary-dark);
        }}
        
        h3 {{
            font-size: 1.25rem;
        }}
        
        p, li {{
            font-size: 1rem;
            color: #374151;
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 24px 0;
            font-size: 0.95rem;
        }}
        
        th, td {{
            padding: 12px 16px;
            border: 1px solid var(--border);
            text-align: left;
        }}
        
        th {{
            background-color: #f9fafb;
            font-weight: 600;
            color: #111827;
        }}
        
        tr:nth-child(even) {{
            background-color: #fdfdfd;
        }}
        
        pre, code {{
            font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
        }}
        
        code {{
            background: #f1f5f9;
            color: #b45309;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.9em;
        }}
        
        pre {{
            background: #0f172a;
            color: #f8fafc;
            padding: 18px 24px;
            border-radius: 10px;
            overflow-x: auto;
            font-size: 0.88rem;
            line-height: 1.5;
        }}
        
        pre code {{
            background: transparent;
            color: inherit;
            padding: 0;
        }}
        
        blockquote {{
            border-left: 4px solid var(--primary);
            margin: 20px 0;
            padding: 12px 20px;
            background: #fffbeb;
            color: #92400e;
            border-radius: 0 8px 8px 0;
        }}
        
        .mermaid {{
            margin: 30px 0;
            text-align: center;
            background: #ffffff;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid var(--border);
        }}
        
        hr {{
            border: none;
            border-top: 1px solid var(--border);
            margin: 40px 0;
        }}
        
        @media print {{
            body {{
                background: #fff;
                padding: 0;
            }}
            .no-print-bar {{
                display: none !important;
            }}
            .doc-container {{
                box-shadow: none;
                padding: 0;
                max-width: 100%;
            }}
            h1 {{
                page-break-before: always;
            }}
            .doc-container > h1:first-of-type {{
                page-break-before: avoid;
            }}
            pre, table, .mermaid {{
                page-break-inside: avoid;
            }}
            @page {{
                margin: 2cm;
                size: letter;
            }}
        }}
    </style>
</head>
<body>

    <div class="no-print-bar">
        <div>
            <strong>Tesina Técnica Burger 24/7</strong> &mdash; Vista previa de impresión
            <div style="font-size: 0.85em; opacity: 0.85;">Haga clic en el botón o presione Ctrl+P para guardar en formato PDF</div>
        </div>
        <button onclick="window.print()">Exportar a PDF (Imprimir)</button>
    </div>

    <div class="doc-container" id="content">
        Cargando monografía y renderizando diagramas...
    </div>

    <script>
        mermaid.initialize({{ startOnLoad: false, theme: 'default' }});

        const rawMarkdown = `{escaped_md}`;

        // Personalizar renderizado de código para mermaid
        const renderer = new marked.Renderer();
        const defaultCodeRenderer = renderer.code.bind(renderer);

        renderer.code = function(code, language) {{
            if (language === 'mermaid') {{
                return '<div class="mermaid">' + code + '</div>';
            }}
            return defaultCodeRenderer(code, language);
        }};

        marked.setOptions({{
            renderer: renderer,
            gfm: true,
            breaks: false
        }});

        document.getElementById('content').innerHTML = marked.parse(rawMarkdown);

        // Renderizar mermaid
        setTimeout(() => {{
            mermaid.run();
        }}, 200);
    </script>
</body>
</html>"""

    with open(OUT_HTML, 'w', encoding='utf-8') as f:
        f.write(html_template)
    print(f"[OK] Archivo HTML para exportación a PDF generado: {OUT_HTML}")

def main():
    print("==========================================================")
    print("   Compilador de Tesina Técnica / Monografía Burger 24/7   ")
    print("==========================================================")
    md_content = compile_markdown()
    generate_html(md_content)
    print("\n[ÉXITO] Documentos generados exitosamente:")
    print(f"  1. Documento Markdown completo: {OUT_MD}")
    print(f"  2. Documento HTML listo para imprimir/PDF: {OUT_HTML}")
    print("\nPara obtener su PDF final:")
    print("  -> Abra 'TESINA_COMPLETA.html' en Chrome/Edge/Firefox y presione Ctrl+P.")
    print("==========================================================")

if __name__ == '__main__':
    main()
