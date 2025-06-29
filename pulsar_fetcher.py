import json
from psrqpy import QueryATNF

def main():
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

    # Spara i rätt mapp för MagicMirror-modulen
    with open("modules/MMM-DeepSpaceSignals/pulsars.json", "w") as f:
        json.dump(pulsars, f)

if __name__ == "__main__":
    main()
