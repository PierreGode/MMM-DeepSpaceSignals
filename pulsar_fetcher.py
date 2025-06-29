# pulsar_fetcher.py
import json
from psrqpy import QueryATNF

query = QueryATNF(params=['JNAME', 'P0', 'DM', 'RAJ', 'DECJ'], condition='P0 < 0.01')  # Exempel: pulsarer med kort period
results = query.table

# Begränsa och förenkla data
pulsars = []
for row in results[:10]:  # Ta första 10
    pulsars.append({
        "type": "Pulsar",
        "name": row['JNAME'],
        "period": row['P0'],
        "dispersion": row['DM'],
        "position": f"{row['RAJ']} {row['DECJ']}"
    })

with open("pulsars.json", "w") as f:
    json.dump(pulsars, f)
