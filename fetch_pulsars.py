from psrqpy import QueryATNF
import json
import sys


def fetch_last_5_pulsars():
    query = QueryATNF()
    table = query.table

    if 'PEPOCH' in table.colnames:
        mask = ~table['PEPOCH'].mask if hasattr(table['PEPOCH'], 'mask') else [True] * len(table['PEPOCH'])
        filtered = table[mask]
        sorted_table = filtered[filtered.argsort('PEPOCH')[::-1]]
    else:
        sorted_table = table

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
    data = fetch_last_5_pulsars()
    json.dump(data, sys.stdout)
