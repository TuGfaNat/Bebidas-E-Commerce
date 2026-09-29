#!/usr/bin/env python3
"""
Generador de Documento Word (.docx) para la Tesina / Monografía Burger 24/7
Crea un documento Word con maquetación académica formal, carátula,
resumen ejecutivo, estilos tipográficos, tablas y los 7 capítulos técnicos.
"""

import os
import re
from datetime import datetime
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DOCS_DIR = os.path.join(ROOT_DIR, "docs")
OUT_DOCX = os.path.join(ROOT_DIR, "TESINA_COMPLETA.docx")
OUT_DOCX_COPY = os.path.join(ROOT_DIR, "EJEMPLO_TESINA_BURGER_247.docx")

CHAPTERS = [
    ("Capítulo 1: Infraestructura, Arquitectura y Despliegue", "tesina_infrastructure.md"),
    ("Capítulo 2: Diagramas del Sistema y Modelado C4", "tesina_diagrams.md"),
    ("Capítulo 3: Arquitectura de Seguridad y Criptografía", "tesina_security.md"),
    ("Capítulo 4: Transacciones, Máquinas de Estados y Reglas de Negocio", "tesina_transactions.md"),
    ("Capítulo 5: Manual de Integración Frontend-Backend y Catálogo de APIs", "tesina_integration.md"),
    ("Capítulo 6: Interfaz de Usuario y Componentes Frontend", "tesina_frontend.md"),
    ("Capítulo 7: Manual de Usuario, Pruebas Operativas y Conclusiones", "tesina_manual_conclusion.md")
]

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def add_inline_formatted_text(paragraph, text):
    # Regex para extraer **negrita**, *cursiva*, `código`
    pattern = re.compile(r'(\*\*.*?\*\*|\*.*?\*|`.*?`)')
    parts = pattern.split(text)
    for part in parts:
        if not part:
            continue
        if part.startswith('**') and part.endswith('**') and len(part) >= 4:
            run = paragraph.add_run(part[2:-2])
            run.bold = True
        elif part.startswith('*') and part.endswith('*') and len(part) >= 2:
            run = paragraph.add_run(part[1:-1])
            run.italic = True
        elif part.startswith('`') and part.endswith('`') and len(part) >= 2:
            run = paragraph.add_run(part[1:-1])
            run.font.name = 'Consolas'
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(180, 83, 9)
        else:
            paragraph.add_run(part)

def build_cover_page(doc):
    # Márgenes de la página
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.2)
        section.right_margin = Inches(1.0)

    # Encabezado institucional
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_inst1 = p_inst.add_run("UNIVERSIDAD MAYOR DE SAN ANDRÉS\n")
    r_inst1.bold = True
    r_inst1.font.size = Pt(15)
    r_inst1.font.color.rgb = RGBColor(30, 41, 59)

    r_inst2 = p_inst.add_run("FACULTAD DE CIENCIAS PURAS Y NATURALES\nCARRERA DE INFORMÁTICA\n")
    r_inst2.bold = True
    r_inst2.font.size = Pt(12)
    r_inst2.font.color.rgb = RGBColor(71, 85, 105)

    doc.add_paragraph("\n\n")

    # Título Principal
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run("SISTEMA E-COMMERCE Y PLATAFORMA DE DESPACHO LOGÍSTICO EN TIEMPO REAL CON ARQUITECTURA DE MICROSERVICIOS 'BURGER 24/7'\n")
    r_title.bold = True
    r_title.font.size = Pt(18)
    r_title.font.color.rgb = RGBColor(217, 119, 6)

    # Subtítulo
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_sub.add_run("Monografía Técnica y Proyecto de Grado para la Implementación de Comercio Electrónico Multi-Actor con Auditoría Criptográfica Inmutable (BMAD)\n")
    r_sub.italic = True
    r_sub.font.size = Pt(11.5)
    r_sub.font.color.rgb = RGBColor(100, 116, 139)

    doc.add_paragraph("\n\n\n")

    # Datos de Autor y Tutor
    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    r_post = p_meta.add_run("POSTULANTE:\n")
    r_post.bold = True
    r_post.font.size = Pt(11)
    
    r_post_name = p_meta.add_run("Univ. Nataly Gemio (TuGfaNat)\n\n")
    r_post_name.font.size = Pt(12)
    
    r_tut = p_meta.add_run("TUTOR ACADÉMICO / DOCENTE GUÍA:\n")
    r_tut.bold = True
    r_tut.font.size = Pt(11)
    
    r_tut_name = p_meta.add_run("Área de Ingeniería de Software y Sistemas Distribuidos\n\n")
    r_tut_name.font.size = Pt(12)

    doc.add_paragraph("\n\n")

    # Lugar y Fecha
    p_date = doc.add_paragraph()
    p_date.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_date = p_date.add_run("La Paz &mdash; Bolivia\n2026")
    r_date.bold = True
    r_date.font.size = Pt(11)

    doc.add_page_break()

def build_summary_page(doc):
    h_res = doc.add_heading("RESUMEN EJECUTIVO", level=1)
    h_res.runs[0].font.color.rgb = RGBColor(30, 41, 59)
    
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(10)
    add_inline_formatted_text(p, 
        "La presente monografía técnica describe el análisis, diseño, modelado, implementación y despliegue de **Burger 24/7**, "
        "una plataforma integral de comercio electrónico de alta disponibilidad especializada en la venta, preparación, despacho "
        "y entrega de comida rápida en horario continuo. El sistema aborda las problemáticas operativas críticas de los modelos "
        "tradicionales: falta de trazabilidad en cobros en efectivo contraentrega, latencia en la asignación de pedidos a repartidores "
        "y sobrecarga de procesamiento en servidores monolíticos."
    )

    p2 = doc.add_paragraph()
    p2.paragraph_format.line_spacing = 1.15
    p2.paragraph_format.space_after = Pt(10)
    add_inline_formatted_text(p2,
        "La arquitectura del sistema se fundamenta en un ecosistema desacoplado de **microservicios orientados a dominio (DDD)** "
        "implementados en **PHP 8.2+ con PDO**, combinados con un motor logístico geoespacial en **Python** para el cálculo geodésico "
        "mediante la **Fórmula Haversine**. La persistencia relacional se ejecuta sobre **MySQL / MariaDB** bajo una estructura estrictamente "
        "normalizada en **Tercera Forma Normal (3FN)** con transacciones ACID y bloqueo pesimista `FOR UPDATE` para garantizar integridad atómica "
        "en el stock de inventario."
    )

    p3 = doc.add_paragraph()
    p3.paragraph_format.line_spacing = 1.15
    p3.paragraph_format.space_after = Pt(14)
    add_inline_formatted_text(p3,
        "Para garantizar transparencia y prevención de fraudes, se implementó el estándar de auditoría **BMAD (Bounded Microservice Architecture Delivery)** "
        "junto con un **Ledger Inmutable (`auditoria_logs`)** que registra cada inserción, actualización o eliminación con marca temporal UTC, "
        "dirección IP del operador y firma digital por tokens **JWT HMAC-SHA256**. El frontend responsivo fue construido en **Vanilla JavaScript (ES6+) "
        "con Leaflet.js y CSS3 Glassmorphism**, integrando una capa de abstracción HTTP resiliente con conmutación por error (fallback) a almacenamiento local."
    )

    p_kw = doc.add_paragraph()
    r_kw = p_kw.add_run("Palabras Clave: ")
    r_kw.bold = True
    r_kw.font.color.rgb = RGBColor(217, 119, 6)
    p_kw.add_run("Microservicios, E-commerce 24/7, Fórmula Haversine, Leaflet.js, Tokens JWT, Bcrypt, MySQL InnoDB 3FN, Transacciones ACID, Ledger de Auditoría Inmutable.")

    doc.add_page_break()

def parse_and_append_markdown(doc, filepath, chapter_title):
    doc.add_page_break()
    h_chap = doc.add_heading(chapter_title, level=1)
    if h_chap.runs:
        h_chap.runs[0].font.color.rgb = RGBColor(217, 119, 6)

    if not os.path.exists(filepath):
        doc.add_paragraph(f"[Alerta: Archivo {filepath} no encontrado]")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    in_code_block = False
    code_lines = []
    in_table = False
    table_rows = []

    def flush_table():
        nonlocal in_table, table_rows
        if not table_rows:
            in_table = False
            return
        
        # Filtrar separadores (|---|---|)
        valid_rows = [r for r in table_rows if not re.match(r'^\s*\|?(\s*:?-+:?\s*\|)+\s*$', '|'.join(r))]
        if not valid_rows:
            in_table = False
            table_rows = []
            return

        num_cols = max(len(r) for r in valid_rows)
        table = doc.add_table(rows=len(valid_rows), cols=num_cols)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = True

        for row_idx, row_data in enumerate(valid_rows):
            is_header = (row_idx == 0)
            for col_idx in range(num_cols):
                cell_text = row_data[col_idx] if col_idx < len(row_data) else ""
                cell = table.cell(row_idx, col_idx)
                cell.text = ""
                p = cell.paragraphs[0]
                p.paragraph_format.line_spacing = 1.05
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.space_before = Pt(2)
                
                add_inline_formatted_text(p, cell_text.strip())
                
                if is_header:
                    set_cell_background(cell, "F1F5F9")
                    for r in p.runs:
                        r.bold = True
                        r.font.size = Pt(9.5)
                        r.font.color.rgb = RGBColor(15, 23, 42)
                else:
                    if row_idx % 2 == 0:
                        set_cell_background(cell, "FAFAFA")
                    for r in p.runs:
                        r.font.size = Pt(9)
                set_cell_margins(cell, top=80, bottom=80, left=120, right=120)

        doc.add_paragraph()
        in_table = False
        table_rows = []

    def flush_code():
        nonlocal in_code_block, code_lines
        if not code_lines:
            in_code_block = False
            return
        
        # Bloque de código con fondo grisáceo
        p_code = doc.add_paragraph()
        p_code.paragraph_format.left_indent = Inches(0.2)
        p_code.paragraph_format.right_indent = Inches(0.2)
        p_code.paragraph_format.space_before = Pt(6)
        p_code.paragraph_format.space_after = Pt(6)
        
        code_text = "".join(code_lines)
        run = p_code.add_run(code_text)
        run.font.name = 'Consolas'
        run.font.size = Pt(8.5)
        run.font.color.rgb = RGBColor(30, 41, 59)
        
        in_code_block = False
        code_lines = []

    for line in lines:
        stripped = line.strip()

        # Manejo de bloques de código (```)
        if stripped.startswith("```"):
            if in_code_block:
                flush_code()
            else:
                if in_table:
                    flush_table()
                in_code_block = True
                code_lines = []
            continue

        if in_code_block:
            code_lines.append(line)
            continue

        # Manejo de tablas (| ... |)
        if stripped.startswith("|") and stripped.endswith("|"):
            cells = [c.strip() for c in stripped.strip("|").split("|")]
            table_rows.append(cells)
            in_table = True
            continue
        elif in_table:
            flush_table()

        # Línea en blanco
        if not stripped:
            continue

        # Encabezados Markdown
        if stripped.startswith("# "):
            h = doc.add_heading(level=2)
            add_inline_formatted_text(h, stripped[2:])
            if h.runs:
                h.runs[0].font.color.rgb = RGBColor(30, 41, 59)
        elif stripped.startswith("## "):
            h = doc.add_heading(level=2)
            add_inline_formatted_text(h, stripped[3:])
            if h.runs:
                h.runs[0].font.color.rgb = RGBColor(180, 83, 9)
        elif stripped.startswith("### "):
            h = doc.add_heading(level=3)
            add_inline_formatted_text(h, stripped[4:])
            if h.runs:
                h.runs[0].font.color.rgb = RGBColor(51, 65, 85)
        elif stripped.startswith("#### "):
            h = doc.add_heading(level=4)
            add_inline_formatted_text(h, stripped[5:])
        # Citas (Blockquotes)
        elif stripped.startswith("> "):
            p_q = doc.add_paragraph()
            p_q.paragraph_format.left_indent = Inches(0.3)
            p_q.paragraph_format.space_before = Pt(4)
            p_q.paragraph_format.space_after = Pt(4)
            r_bar = p_q.add_run("┃ ")
            r_bar.bold = True
            r_bar.font.color.rgb = RGBColor(217, 119, 6)
            add_inline_formatted_text(p_q, stripped[2:])
            for r in p_q.runs[1:]:
                r.italic = True
                r.font.color.rgb = RGBColor(71, 85, 105)
        # Listas con viñetas
        elif stripped.startswith("- ") or stripped.startswith("* "):
            p_li = doc.add_paragraph(style='List Bullet')
            p_li.paragraph_format.space_after = Pt(2)
            add_inline_formatted_text(p_li, stripped[2:])
        # Listas numeradas
        elif re.match(r'^\d+\.\s+', stripped):
            match = re.match(r'^\d+\.\s+(.*)$', stripped)
            p_num = doc.add_paragraph(style='List Number')
            p_num.paragraph_format.space_after = Pt(2)
            add_inline_formatted_text(p_num, match.group(1))
        # Párrafo estándar
        else:
            p = doc.add_paragraph()
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_after = Pt(6)
            add_inline_formatted_text(p, stripped)

    if in_table:
        flush_table()
    if in_code_block:
        flush_code()

def main():
    print("==========================================================")
    print("   Generando Documento Microsoft Word (.docx) de Tesina   ")
    print("==========================================================")

    doc = Document()
    
    # Configurar estilo Normal
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Calibri'
    style_normal.font.size = Pt(11)
    style_normal.font.color.rgb = RGBColor(31, 41, 55)

    print("[1/3] Construyendo carátula y portada académica...")
    build_cover_page(doc)

    print("[2/3] Generando resumen ejecutivo y tabla de contenido...")
    build_summary_page(doc)

    print("[3/3] Procesando e incorporando los 7 capítulos de la monografía...")
    for title, filename in CHAPTERS:
        filepath = os.path.join(DOCS_DIR, filename)
        print(f"  -> Agregando: {title}")
        parse_and_append_markdown(doc, filepath, title)

    doc.save(OUT_DOCX)
    doc.save(OUT_DOCX_COPY)
    print("\n==========================================================")
    print("[ÉXITO] Documentos Microsoft Word generados correctamente:")
    print(f"  1. Documento Maestro: {OUT_DOCX}")
    print(f"  2. Copia de Ejemplo:  {OUT_DOCX_COPY}")
    print("==========================================================")

if __name__ == '__main__':
    main()
