#!/usr/bin/env python3
"""Assemble _build/ modules into a single siege.html."""
import re, sys, glob, os

BUILD = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BUILD, '..', 'siege.html')

def numbered(ext):
    files = sorted(glob.glob(os.path.join(BUILD, '[0-9][0-9]-*.' + ext)))
    return files

def banner(path):
    name = os.path.basename(path)
    return f"\n/* ╔══════════════ {name} ══════════════╗ */\n"

css_parts, js_parts = [], []
for f in numbered('css'):
    css_parts.append(banner(f) + open(f, encoding='utf-8').read())
for f in numbered('js'):
    js_parts.append(banner(f) + open(f, encoding='utf-8').read())

shell = open(os.path.join(BUILD, 'shell.html'), encoding='utf-8').read()
css = '\n'.join(css_parts)
js = '\n'.join(js_parts)

# script-tag safety: the assembled JS must not contain a closing script sequence
js = js.replace('</script>', '<\\/script>')

html = shell.replace('/*__CSS__*/', css).replace('/*__JS__*/', js)

with open(OUT, 'w', encoding='utf-8') as fh:
    fh.write(html)

print(f"wrote {os.path.abspath(OUT)}  ({len(html)//1024} KB)")
print("css files:", [os.path.basename(f) for f in numbered('css')])
print("js files: ", [os.path.basename(f) for f in numbered('js')])
