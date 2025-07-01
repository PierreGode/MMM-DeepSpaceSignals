import json
import logging
import os
from psrqpy import QueryATNF

def main():
    logging.basicConfig(level=logging.INFO)
    logging.info("[DSS py] querying pulsar database")
    query = QueryATNF(params=['JNAME', 'P0', 'DM', 'RAJ', 'DECJ'], condition='P0 < 0.01')
    results = query.table

    pulsars = []

    for row in results[:10]:  # Begränsa till de 10 första resultaten
        pulsars.append({
            "type": "Pulsar",
            "name": row['JNAME'],
            "period": row['P0'],
            "dispersion": row['DM'],
            "position": f"{row['RAJ']} {row['DECJ']}"
        })

    logging.info("[DSS py] writing %d pulsars to file", len(pulsars))
    out_path = os.path.join(os.path.dirname(__file__), "pulsars.json")
    with open(out_path, "w") as f:
        json.dump(pulsars, f)

if __name__ == "__main__":
    main()
