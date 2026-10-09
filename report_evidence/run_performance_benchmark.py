import time
import json
import numpy as np
import httpx
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = 'http://localhost:5000/api'

TEST_CASES = [
    {
        'name': 'POST /api/predictions/crop',
        'url': f'{BASE_URL}/predictions/crop',
        'payload': {
            'user_id': 29, 'state': 'Punjab',
            'N': 90, 'P': 42, 'K': 43, 'ph': 6.5,
            'temperature': 24.5, 'humidity': 62.0, 'rainfall': 140.0
        }
    },
    {
        'name': 'POST /api/predictions/pest',
        'url': f'{BASE_URL}/predictions/pest',
        'payload': {
            'user_id': 29, 'state': 'Punjab', 'crop': 'Cotton',
            'N': 40, 'P': 70, 'K': 35, 'ph': 6.2,
            'temperature': 28.0, 'humidity': 70.0, 'rainfall': 110.0
        }
    },
    {
        'name': 'POST /api/predictions/yield',
        'url': f'{BASE_URL}/predictions/yield',
        'payload': {
            'user_id': 29, 'state': 'Punjab', 'crop_type': 'rice', 'area': 2.0,
            'N': 90, 'P': 42, 'K': 43, 'ph': 6.5,
            'temperature': 24.5, 'humidity': 62.0, 'rainfall': 140.0
        }
    },
    {
        'name': 'POST /api/market/forecast',
        'url': f'{BASE_URL}/market/forecast',
        'payload': {
            'crop_name': 'Rice', 'mandi_id': 3, 'forecast_days': 14
        }
    },
    {
        'name': 'POST /api/auth/login',
        'url': f'{BASE_URL}/auth/login',
        'payload': {
            'email': 'vikram.singh@agriassist.com',
            'password': 'Password@123',
            'role': 'farmer'
        }
    }
]

CONCURRENCY_LEVELS = [1, 10, 25]
TOTAL_REQUESTS = 100


def send_single_request(url, payload):
    start = time.perf_counter()
    try:
        # Create a fresh client or use standard post with timeout
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(url, json=payload)
            elapsed = (time.perf_counter() - start) * 1000.0  # ms
            is_success = (resp.status_code == 200)
            return elapsed, is_success, None
    except Exception as e:
        elapsed = (time.perf_counter() - start) * 1000.0
        return elapsed, False, str(e)


def run_benchmark(tc, concurrency, total_reqs):
    latencies = []
    errors = 0
    err_msgs = []

    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(send_single_request, tc['url'], tc['payload']) for _ in range(total_reqs)]
        for fut in as_completed(futures):
            elapsed, success, err = fut.result()
            latencies.append(elapsed)
            if not success:
                errors += 1
                if err and err not in err_msgs:
                    err_msgs.append(err)

    latencies = np.array(latencies)
    avg_lat = float(np.mean(latencies))
    med_lat = float(np.median(latencies))
    p95_lat = float(np.percentile(latencies, 95))
    min_lat = float(np.min(latencies))
    max_lat = float(np.max(latencies))

    return {
        'concurrency': concurrency,
        'total_requests': total_reqs,
        'avg_ms': round(avg_lat, 2),
        'median_ms': round(med_lat, 2),
        'p95_ms': round(p95_lat, 2),
        'min_ms': round(min_lat, 2),
        'max_ms': round(max_lat, 2),
        'errors': errors,
        'error_rate': f"{(errors / total_reqs) * 100:.1f}%",
        'error_details': err_msgs
    }


def main():
    print("=" * 80)
    print("AGRISMART AI — PERFORMANCE BENCHMARK (100 Requests per Concurrency)")
    print("=" * 80)

    all_results = {}

    for tc in TEST_CASES:
        name = tc['name']
        print(f"\n>>> Benchmarking Endpoint: {name}")
        all_results[name] = []

        for c in CONCURRENCY_LEVELS:
            print(f"    Running with {c} concurrent user(s)...", flush=True)
            res = run_benchmark(tc, c, TOTAL_REQUESTS)
            all_results[name].append(res)
            print(f"      [Concurrency {c:2d}] Avg: {res['avg_ms']:6.2f} ms | Median: {res['median_ms']:6.2f} ms | p95: {res['p95_ms']:6.2f} ms | Errors: {res['errors']}")

    # Save JSON results
    with open('report_evidence/performance_results.json', 'w') as f:
        json.dump(all_results, f, indent=2)

    print("\nBenchmark completed successfully and saved to report_evidence/performance_results.json!")


if __name__ == '__main__':
    main()
