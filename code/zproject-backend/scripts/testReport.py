"""Genera la tabla de evidencia de las pruebas a partir de results.xml.

Uso (desde la carpeta del backend):
    python -m pytest --junitxml=results.xml
    python scripts/testReport.py
Crea evidencia.html (ábrelo en el navegador y toma captura) y imprime la tabla en consola.
"""
import ast
import html
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

resultsFile = Path(sys.argv[1] if len(sys.argv) > 1 else "results.xml")
testDir = Path("test")

MODULES = {
    "test_auth": "Autenticación",
    "test_material": "Materiales",
    "test_printOrder": "Pedidos 3D",
    "test_client": "Clientes",
    "test_payment": "Pagos",
    "test_repairs": "Reparaciones",
    "test_sparePart": "Repuestos",
    "test_tool": "Herramientas",
    "test_warranty": "Garantías"
}


def loadDocstrings() -> dict[tuple[str, str], str]:
    docs = {}
    for file in testDir.glob("test_*.py"):
        tree = ast.parse(file.read_text(encoding="utf-8"))
        for node in tree.body:
            if isinstance(node, ast.FunctionDef) and node.name.startswith("test_"):
                docs[(file.stem, node.name)] = ast.get_docstring(node) or ""
    return docs


def main() -> None:
    docs = loadDocstrings()
    rows = []
    for case in ET.parse(resultsFile).iter("testcase"):
        moduleName = case.get("classname", "").split(".")[-1]
        name = case.get("name", "")
        doc = docs.get((moduleName, name), "")
        scenario, _, expected = doc.partition("Esperado:")
        failed = case.find("failure") is not None or case.find("error") is not None
        rows.append(
            {
                "id": name.split("_")[1].upper() if "_" in name else name,
                "module": MODULES.get(moduleName, moduleName),
                "scenario": scenario.strip().replace("\n", " "),
                "expected": expected.strip().replace("\n", " "),
                "status": "FALLÓ" if failed else "PASÓ",
                "time": float(case.get("time", 0)),
            }
        )

    rows.sort(key=lambda row: row["id"])
    passed = sum(row["status"] == "PASÓ" for row in rows)

    print(f"{'ID':<7}{'Módulo':<16}{'Estado':<8}Escenario")
    for row in rows:
        print(f"{row['id']:<7}{row['module']:<16}{row['status']:<8}{row['scenario']}")
    print(f"\nTotal: {len(rows)} | Pasaron: {passed} | Fallaron: {len(rows) - passed}")

    body = "".join(
        f"<tr class='{'ok' if row['status'] == 'PASÓ' else 'bad'}'>"
        f"<td>{html.escape(row['id'])}</td><td>{html.escape(row['module'])}</td>"
        f"<td>{html.escape(row['scenario'])}</td><td>{html.escape(row['expected'])}</td>"
        f"<td><b>{row['status']}</b></td><td>{row['time']:.2f}s</td></tr>"
        for row in rows
    )
    Path("evidencia.html").write_text(
        "<!doctype html><meta charset='utf-8'><title>Evidencia de pruebas</title>"
        "<style>body{font-family:Arial;margin:24px}table{border-collapse:collapse;width:100%}"
        "td,th{border:1px solid #bbb;padding:6px 8px;font-size:13px;text-align:left}"
        "th{background:#333;color:#fff}.ok td:nth-child(5){color:#0a7d2c}"
        ".bad td:nth-child(5){color:#c0392b}</style>"
        "<h2>ZProject – Resultados de pruebas unitarias</h2>"
        f"<p>Total: {len(rows)} · Pasaron: {passed} · Fallaron: {len(rows) - passed}</p>"
        "<table><tr><th>ID</th><th>Módulo</th><th>Escenario</th><th>Resultado esperado</th>"
        f"<th>Estado</th><th>Tiempo</th></tr>{body}</table>",
        encoding="utf-8",
    )
    print("\nGenerado: evidencia.html")


main()
