from psrqpy import QueryATNF
import json

def fetch_last_5_pulsars():
    # Query the ATNF Pulsar Catalogue
    query = QueryATNF()
    table = query.table

    # Filter and sort by PEPOCH (if available), else use as-is
    if 'PEPOCH' in table.colnames:
        # Handle masked arrays
        mask = ~table['PEPOCH'].mask if hasattr(table['PEPOCH'], 'mask') else [True] * len(table['PEPOCH'])
        filtered = table[mask]
        # Sort in descending order by PEPOCH (latest first)
        sorted_table = filtered[filtered.argsort('PEPOCH')[::-1]]
    else:
        sorted_table = table

    # Build list of pulsar data dictionaries
    pulsars = []
    for row in sorted_table[:5]:
        pulsars.append({
            'PSRJ': row['PSRJ'] if 'PSRJ' in table.colnames else 'N/A',
            'P0': row['P0'] if 'P0' in table.colnames else None,
            'DM': row['DM'] if 'DM' in table.colnames else None,
            'time': str(row['PEPOCH']) if 'PEPOCH' in table.colnames else ''
        })
    return pulsars

if __name__ == '__main__':
    # Fetch pulsar data
    data = fetch_last_5_pulsars()
    # Output to pulsars.json with UTF-8 encoding and pretty formatting
    with open('pulsars.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
