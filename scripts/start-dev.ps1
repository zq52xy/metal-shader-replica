# [PROTOCOL]: Update this header on change, then check CLAUDE.md.
# INPUT: Local workspace with installed node_modules.
# OUTPUT: Vite dev server at http://127.0.0.1:5173/.
# POS: Owns local dev-server launch only.

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $root

& "D:\nodejs\node.exe" "$root\node_modules\vite\bin\vite.js" --host 127.0.0.1 --port 5173
