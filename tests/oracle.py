#!/usr/bin/env python3
"""Independent oracle for rinkmath. Recomputes every case from first
principles (no shared code with engine.js) and writes expected.json."""
import json, math

GAL_PER_CUFT = 7.48052

def water_gal(L, W, avg_depth_in):
    return L * W * (avg_depth_in / 12.0) * GAL_PER_CUFT

def build(o):
    maxd = o['depth'] + o['slope']
    avg = (o['depth'] + maxd) / 2.0
    gal = water_gal(o['L'], o['W'], avg)
    add = 2 * (o['boardh'] + 18) / 12.0
    linL, linW = o['L'] + add, o['W'] + add
    perim = 2 * (o['L'] + o['W'])
    inches = 0.0; per_day = []
    for t in o['temps']:
        inches += max(0.0, 32.0 - t) / 15.0
        per_day.append(inches)
    days_target = next((i + 1 for i, c in enumerate(per_day) if c >= o.get('target', 2.5)), None)
    return {
        'maxDepth': maxd, 'avgDepth': avg, 'gallons': gal,
        'linerL': linL, 'linerW': linW, 'linerArea': linL * linW,
        'perimeter': perim,
        'boards': math.ceil(perim / o['boardlen']),
        'stakes': math.ceil(perim / 4) + 1,
        'perDay': per_day, 'totalInches': inches, 'daysToTarget': days_target,
        'floodGallons': water_gal(o['L'], o['W'], o.get('flood', 0.125)),
        'fillHours': gal / 5.0 / 60.0,
        'capacity': math.floor(o['L'] * o['W'] / 50),
        'linerUsd': linL * linW * 0.25, 'waterUsd': gal / 1000.0 * 10.0,
    }

cases = []
rinks = [
    dict(L=40, W=20, depth=4, slope=2, boardh=12, boardlen=12, temps=[20,18,24,28,22,15,19]),
    dict(L=24, W=16, depth=3, slope=0, boardh=8, boardlen=8, temps=[10,12,8,15]),
    dict(L=60, W=30, depth=5, slope=6, boardh=16, boardlen=10, temps=[28,30,31,29,27,25,22]),
    dict(L=12, W=12, depth=2, slope=1, boardh=8, boardlen=12, temps=[5,0,8]),
    dict(L=36, W=24, depth=4, slope=3.5, boardh=12, boardlen=16, temps=[32,31,33,20,10,5,0]),
    dict(L=50, W=25, depth=6, slope=4, boardh=16, boardlen=12, temps=[14,17,19,21,23,25,27]),
    dict(L=20, W=20, depth=4, slope=0.5, boardh=8, boardlen=10, temps=[25]*7, target=3.0),
    dict(L=30, W=15, depth=3, slope=2.25, boardh=12, boardlen=8, temps=[0,5,10,15,20,25,30], target=2.0),
]
for o in rinks:
    cases.append({'kind': 'build', 'opts': o, 'expected': build(o)})

with open('expected.json', 'w') as f:
    json.dump({'cases': cases}, f, separators=(',', ':'))
print(f'{len(cases)} cases written')
