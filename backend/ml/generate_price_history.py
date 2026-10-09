"""
SIMULATED MARKET PRICE HISTORY GENERATOR
AgriSmart AI — ML Training Data Infrastructure

NOTE: This script generates simulated daily historical price series (180 days) 
per Mandi and Crop combination. It populates the database `market_prices` table 
to stand in for a live API feed from Agmarknet / APMC market feeds.
"""

import os
import sys
import math
import random
from datetime import datetime, timedelta

# Add backend directory to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from utils.db import get_db_connection

def generate_history(days=180):
    random.seed(42)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # 1. Fetch all Mandis
    cursor.execute("SELECT id, name FROM mandis WHERE status = 'Active'")
    mandis = cursor.fetchall()
    
    if not mandis:
        print("[!] No mandis found in database. Make sure db is initialized.")
        conn.close()
        return

    # Base price anchors per crop (in ₹ per Quintal)
    base_prices = {
        'Rice': 2400.0,
        'Wheat': 2250.0,
        'Maize': 1950.0,
        'Cotton': 6000.0,
        'Tomato': 2800.0,
        'Potato': 1500.0
    }

    start_date = datetime.now().date() - timedelta(days=days)
    
    inserted_count = 0
    skipped_count = 0

    print(f"[+] Generating {days} days of historical prices for {len(mandis)} mandis across {len(base_prices)} crops...")

    for mandi in mandis:
        mandi_id = mandi['id']
        mandi_name = mandi['name']

        # Determine mandi-specific deterministic offset seed
        m_seed = sum(ord(c) for c in mandi_name)

        for crop_name, base_price in base_prices.items():
            crop_seed = sum(ord(c) for c in crop_name)
            rnd = random.Random(m_seed + crop_seed + 42)

            # Define price trend parameters for this (mandi, crop) pair
            trend_slope = rnd.uniform(-0.06, 0.08)  # Gradual 180-day price drift (-6% to +8%)
            cycle_period = rnd.choice([45, 60, 90]) # Seasonal cycle in days
            cycle_amp = base_price * rnd.uniform(0.02, 0.05) # Seasonal amplitude (2-5%)

            # Get existing dates for this mandi and crop to prevent duplicates
            cursor.execute(
                "SELECT price_date FROM market_prices WHERE mandi_id = %s AND crop_name = %s",
                (mandi_id, crop_name)
            )
            existing_rows = cursor.fetchall()
            existing_dates = set()
            for r in existing_rows:
                d_val = r['price_date']
                if hasattr(d_val, 'strftime'):
                    d_val = d_val.strftime('%Y-%m-%d')
                else:
                    d_val = str(d_val)
                existing_dates.add(d_val)

            rows_to_insert = []
            current_price = base_price

            for day_i in range(days):
                curr_date = start_date + timedelta(days=day_i)
                date_str = curr_date.strftime('%Y-%m-%d')

                if date_str in existing_dates:
                    skipped_count += 1
                    continue

                # Calculate deterministic components:
                # 1. Gradual trend drift
                trend_factor = 1.0 + (trend_slope * (day_i / float(days)))
                
                # 2. Seasonal sine-wave cycle
                seasonal_component = cycle_amp * math.sin(2 * math.pi * day_i / float(cycle_period))
                
                # 3. Small daily random fluctuation (noise < 1%)
                daily_noise = rnd.gauss(0, base_price * 0.008)

                daily_modal_price = round(base_price * trend_factor + seasonal_component + daily_noise, 2)
                daily_modal_price = max(daily_modal_price, base_price * 0.5) # lower bound guard

                min_p = round(daily_modal_price * rnd.uniform(0.96, 0.98), 2)
                max_p = round(daily_modal_price * rnd.uniform(1.02, 1.04), 2)

                rows_to_insert.append((
                    mandi_id,
                    crop_name,
                    daily_modal_price,
                    'Quintal',
                    min_p,
                    max_p,
                    daily_modal_price,
                    date_str,
                    'Active'
                ))

            if rows_to_insert:
                cursor.executemany("""
                    INSERT INTO market_prices 
                    (mandi_id, crop_name, price, unit, min_price, max_price, modal_price, price_date, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, rows_to_insert)
                inserted_count += len(rows_to_insert)

    conn.commit()
    conn.close()

    print(f"[+] Price history generation complete! Inserted {inserted_count} rows, skipped {skipped_count} existing rows.")

if __name__ == '__main__':
    generate_history(180)
