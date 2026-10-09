import json
import urllib.request
import urllib.error
from flask import Blueprint, request, jsonify
from utils.db import get_db_connection

weather_bp = Blueprint('weather', __name__)

# Coordinates for Indian States & Union Territories
STATE_COORDINATES = {
    'andhra pradesh': (15.9129, 79.7400),
    'arunachal pradesh': (27.0844, 93.6053),
    'assam': (26.2006, 92.9376),
    'bihar': (25.0961, 85.3131),
    'chhattisgarh': (21.2787, 81.8661),
    'goa': (15.2993, 74.1240),
    'gujarat': (22.2587, 71.1924),
    'haryana': (29.0588, 76.0856),
    'himachal pradesh': (31.1048, 77.1734),
    'jharkhand': (23.6102, 85.2799),
    'karnataka': (15.3173, 75.7139),
    'kerala': (10.8505, 76.2711),
    'madhya pradesh': (22.9734, 78.6569),
    'maharashtra': (19.7515, 75.7139),
    'manipur': (24.6637, 93.9063),
    'meghalaya': (25.4670, 91.3662),
    'mizoram': (23.1645, 92.9376),
    'nagaland': (26.1584, 94.5624),
    'odisha': (20.9517, 85.0985),
    'punjab': (31.1471, 75.3412),
    'rajasthan': (27.0238, 74.2179),
    'sikkim': (27.5330, 88.5122),
    'tamil nadu': (11.1271, 78.6569),
    'telangana': (18.1124, 79.0193),
    'tripura': (23.9408, 91.9882),
    'uttar pradesh': (26.8467, 80.9462),
    'uttarakhand': (30.0668, 79.0193),
    'west bengal': (22.9868, 87.8550),
    'delhi': (28.7041, 77.1025)
}

WMO_DESCRIPTIONS = {
    0: ("Clear sky", "Sunny"),
    1: ("Mainly clear", "Mainly Sunny"),
    2: ("Partly cloudy", "Partly Cloudy"),
    3: ("Overcast", "Overcast"),
    45: ("Fog", "Foggy"),
    48: ("Depositing rime fog", "Dense Fog"),
    51: ("Light drizzle", "Light Drizzle"),
    53: ("Moderate drizzle", "Drizzle"),
    55: ("Dense drizzle", "Heavy Drizzle"),
    61: ("Slight rain", "Light Rain"),
    63: ("Moderate rain", "Moderate Rain"),
    65: ("Heavy rain", "Heavy Rain"),
    71: ("Slight snowfall", "Light Snow"),
    73: ("Moderate snowfall", "Moderate Snow"),
    75: ("Heavy snowfall", "Heavy Snow"),
    80: ("Slight rain showers", "Passing Showers"),
    81: ("Moderate rain showers", "Rain Showers"),
    82: ("Violent rain showers", "Heavy Showers"),
    95: ("Thunderstorm", "Thunderstorm"),
    96: ("Thunderstorm with slight hail", "Severe Storm"),
    99: ("Thunderstorm with heavy hail", "Severe Hailstorm"),
}

DEFAULT_FALLBACK_NORMALS = {
    'temperature': 28.5,
    'humidity': 65.0,
    'rainfall': 110.0
}


def _get_wmo_info(code):
    return WMO_DESCRIPTIONS.get(int(code), ("Fair weather", "Partly Cloudy"))


def _generate_agronomic_advisories(current_temp, wind_speed, current_humidity, rain_prob, total_rain_7d):
    """Derive practical agricultural recommendations from verified weather data."""
    advisories = []

    # 1. Spray window advisory
    if wind_speed > 18:
        advisories.append({
            'type': 'spray',
            'severity': 'warning',
            'title': 'High Wind — Avoid Spraying',
            'message': f'Wind speed is {wind_speed:.1f} km/h. High drift hazard; withhold pesticide and foliar fertilizer sprays.'
        })
    elif rain_prob > 50:
        advisories.append({
            'type': 'spray',
            'severity': 'warning',
            'title': 'Rain Imminent — Withhold Chemical Sprays',
            'message': f'{rain_prob}% chance of rain. Sprays will be washed off before systemic absorption.'
        })
    else:
        advisories.append({
            'type': 'spray',
            'severity': 'positive',
            'title': 'Favorable Spray Window',
            'message': f'Light breeze ({wind_speed:.1f} km/h) and low rain risk ({rain_prob}%). Suitable for foliar nutrition and pest management.'
        })

    # 2. Irrigation advisory
    if total_rain_7d > 35:
        advisories.append({
            'type': 'irrigation',
            'severity': 'info',
            'title': 'Hold Irrigation — Significant Rain Forecast',
            'message': f'{total_rain_7d:.1f} mm rain forecast this week. Defer routine canal/borewell irrigation to conserve water and prevent waterlogging.'
        })
    elif total_rain_7d < 5 and current_temp > 32:
        advisories.append({
            'type': 'irrigation',
            'severity': 'warning',
            'title': 'High Evapotranspiration — Schedule Irrigation',
            'message': f'Dry spell with temperatures at {current_temp:.1f}°C. Provide scheduled drip/furrow irrigation during early morning or late evening.'
        })
    else:
        advisories.append({
            'type': 'irrigation',
            'severity': 'positive',
            'title': 'Standard Irrigation Schedule',
            'message': 'Moderate moisture conditions. Maintain routine soil-moisture-based irrigation intervals.'
        })

    # 3. Temperature & Pest stress
    if current_temp > 37:
        advisories.append({
            'type': 'temperature',
            'severity': 'warning',
            'title': 'Heat Stress Alert',
            'message': 'Ambient temperature exceeds 37°C. Provide light sprinkler misting to lower canopy heat and prevent flower drop.'
        })
    elif current_temp < 10:
        advisories.append({
            'type': 'temperature',
            'severity': 'warning',
            'title': 'Cold / Chilling Stress',
            'message': 'Low nighttime temperatures. Consider straw mulching or smoke screens for sensitive nursery crops.'
        })
    elif current_humidity > 80 and current_temp > 25:
        advisories.append({
            'type': 'pest_disease',
            'severity': 'info',
            'title': 'Fungal & Blight Vigilance',
            'message': 'High relative humidity combined with warmth promotes fungal spores. Inspect crop leaf undersides for mildew or leaf spots.'
        })

    return advisories


@weather_bp.route('/forecast', methods=['GET'])
def get_weather_forecast():
    """
    Returns real-time 7-day agricultural weather forecast.
    Calls Open-Meteo free API (no API key required).
    Falls back gracefully to verified state climate normals from MySQL on network failure.
    """
    state = (request.args.get('state') or 'Andhra Pradesh').strip()
    district = (request.args.get('district') or '').strip()
    lat_param = request.args.get('lat')
    lon_param = request.args.get('lon')

    # Resolve coordinates
    lat, lon = None, None
    if lat_param and lon_param:
        try:
            lat = float(lat_param)
            lon = float(lon_param)
        except (ValueError, TypeError):
            lat, lon = None, None

    if lat is None or lon is None:
        state_key = state.lower()
        if state_key in STATE_COORDINATES:
            lat, lon = STATE_COORDINATES[state_key]
        else:
            lat, lon = STATE_COORDINATES['andhra pradesh']

    # Attempt Open-Meteo call
    api_url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat:.4f}&longitude={lon:.4f}&"
        f"current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&"
        f"daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&"
        f"timezone=auto"
    )

    try:
        req = urllib.request.Request(
            api_url,
            headers={'User-Agent': 'AgriSmart-Assistant/2.0'}
        )
        with urllib.request.urlopen(req, timeout=4.0) as resp:
            data = json.loads(resp.read().decode('utf-8'))

        current = data.get('current', {})
        daily = data.get('daily', {})

        curr_temp = current.get('temperature_2m', 28.0)
        curr_hum = current.get('relative_humidity_2m', 65.0)
        curr_feel = current.get('apparent_temperature', curr_temp)
        curr_precip = current.get('precipitation', 0.0)
        curr_wind = current.get('wind_speed_10m', 8.5)
        curr_code = current.get('weather_code', 0)
        desc, short_cond = _get_wmo_info(curr_code)

        time_arr = daily.get('time', [])
        max_arr = daily.get('temperature_2m_max', [])
        min_arr = daily.get('temperature_2m_min', [])
        rain_sum_arr = daily.get('precipitation_sum', [])
        rain_prob_arr = daily.get('precipitation_probability_max', [])
        code_arr = daily.get('weather_code', [])

        forecast_list = []
        total_rain_7d = sum(rain_sum_arr[:7]) if rain_sum_arr else 0.0

        for i in range(min(7, len(time_arr))):
            d_code = code_arr[i] if i < len(code_arr) else 0
            d_desc, d_short = _get_wmo_info(d_code)
            forecast_list.append({
                'date': time_arr[i],
                'max_temp': round(max_arr[i], 1) if i < len(max_arr) else curr_temp,
                'min_temp': round(min_arr[i], 1) if i < len(min_arr) else curr_temp - 6.0,
                'precipitation_sum': round(rain_sum_arr[i], 1) if i < len(rain_sum_arr) else 0.0,
                'precipitation_probability': rain_prob_arr[i] if i < len(rain_prob_arr) else 0,
                'condition': d_short,
                'description': d_desc,
                'weather_code': d_code
            })

        first_rain_prob = rain_prob_arr[0] if rain_prob_arr else 10
        advisories = _generate_agronomic_advisories(curr_temp, curr_wind, curr_hum, first_rain_prob, total_rain_7d)

        return jsonify({
            'status': 'success',
            'is_fallback': False,
            'source': 'Open-Meteo Agrometeorology Live API',
            'location': {
                'state': state,
                'district': district or 'Regional Center',
                'latitude': lat,
                'longitude': lon
            },
            'current': {
                'temperature': round(curr_temp, 1),
                'feels_like': round(curr_feel, 1),
                'humidity': round(curr_hum, 1),
                'precipitation': round(curr_precip, 1),
                'wind_speed': round(curr_wind, 1),
                'weather_code': curr_code,
                'condition': short_cond,
                'description': desc
            },
            'daily': forecast_list,
            'advisories': advisories
        }), 200

    except Exception as e:
        # Fallback to MySQL climate_normals baseline
        normals = DEFAULT_FALLBACK_NORMALS
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor(dictionary=True)
                cursor.execute(
                    "SELECT temperature, humidity, rainfall FROM climate_normals WHERE LOWER(state) = LOWER(%s)",
                    (state,)
                )
                row = cursor.fetchone()
                if row:
                    normals = {
                        'temperature': float(row.get('temperature', 28.5)),
                        'humidity': float(row.get('humidity', 65.0)),
                        'rainfall': float(row.get('rainfall', 110.0))
                    }
                cursor.close()
                conn.close()
            except Exception:
                pass

        base_t = normals['temperature']
        base_h = normals['humidity']
        base_r = normals['rainfall']

        import datetime
        today = datetime.date.today()
        fallback_daily = []
        for i in range(7):
            d = today + datetime.timedelta(days=i)
            # Subtle variation around normal
            t_offset = ((i % 3) - 1) * 0.8
            p_sum = round(max(0.0, (base_r / 30.0) * (0.8 + 0.1 * (i % 4))), 1)
            p_prob = min(85, max(10, int((p_sum / 8.0) * 50)))
            fallback_daily.append({
                'date': d.isoformat(),
                'max_temp': round(base_t + 3.5 + t_offset, 1),
                'min_temp': round(base_t - 3.5 + t_offset, 1),
                'precipitation_sum': p_sum,
                'precipitation_probability': p_prob,
                'condition': 'Partly Cloudy' if p_sum < 4 else 'Scattered Showers',
                'description': 'Typical seasonal pattern',
                'weather_code': 2 if p_sum < 4 else 80
            })

        advisories = _generate_agronomic_advisories(base_t, 10.0, base_h, 20, (base_r / 30.0) * 7)

        return jsonify({
            'status': 'success',
            'is_fallback': True,
            'fallback_reason': f'Live weather feed offline ({str(e)[:60]}); using regional climate baseline.',
            'source': 'Regional Climate Normals Baseline',
            'location': {
                'state': state,
                'district': district or 'State Average',
                'latitude': lat,
                'longitude': lon
            },
            'current': {
                'temperature': round(base_t, 1),
                'feels_like': round(base_t + 1.2, 1),
                'humidity': round(base_h, 1),
                'precipitation': 0.0,
                'wind_speed': 10.0,
                'weather_code': 2,
                'condition': 'Seasonal Normal',
                'description': 'Climate normal baseline conditions'
            },
            'daily': fallback_daily,
            'advisories': advisories
        }), 200
