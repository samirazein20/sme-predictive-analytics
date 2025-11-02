"""
Manual test script for benchmark API endpoints.
Run the FastAPI server first, then run this script.
"""

import requests
import json
from datetime import date

BASE_URL = "http://localhost:8000/api/benchmarks"


def test_health():
    """Test health check endpoint."""
    print("\n=== Testing Health Check ===")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200


def test_get_industries():
    """Test getting list of industries."""
    print("\n=== Testing Get Industries ===")
    response = requests.get(f"{BASE_URL}/industries")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Found {data['count']} industries: {', '.join(data['industries'][:5])}...")
    return response.status_code == 200


def test_get_industry_info():
    """Test getting industry information."""
    print("\n=== Testing Get Industry Info ===")
    response = requests.get(f"{BASE_URL}/industries/retail")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Industry: {data['industry']}")
    print(f"Available metrics: {data['metric_count']}")
    print(f"Metrics: {', '.join(data['available_metrics'][:3])}...")
    return response.status_code == 200


def test_get_metrics():
    """Test getting metrics for an industry."""
    print("\n=== Testing Get Metrics ===")
    response = requests.get(f"{BASE_URL}/metrics/restaurant")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Found {data['count']} metrics for {data['industry']}")
    print(f"Metrics: {', '.join(data['metrics'])}")
    return response.status_code == 200


def test_get_benchmark_data():
    """Test getting benchmark data."""
    print("\n=== Testing Get Benchmark Data ===")
    
    payload = {
        "industry": "retail",
        "company_size": "medium",
        "region": "national",
        "metrics": ["revenue_per_employee", "profit_margin"],
        "start_date": "2024-01-01",
        "end_date": "2024-03-01"
    }
    
    response = requests.post(f"{BASE_URL}/data", json=payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Received {len(data)} benchmark series")
        
        for series in data:
            print(f"\n  Metric: {series['metric_name']}")
            print(f"  Data points: {len(series['data_points'])}")
            if series['data_points']:
                first_point = series['data_points'][0]
                print(f"  First value: ${first_point['value']:,.2f}")
                print(f"  25th percentile: ${first_point['percentile_25']:,.2f}")
                print(f"  75th percentile: ${first_point['percentile_75']:,.2f}")
    else:
        print(f"Error: {response.text}")
    
    return response.status_code == 200


def test_compare_to_benchmark():
    """Test comparing user values to benchmark."""
    print("\n=== Testing Compare to Benchmark ===")
    
    payload = {
        "user_values": {
            "revenue_per_employee": 180000.0,
            "profit_margin": 0.10
        },
        "industry": "retail",
        "company_size": "medium",
        "region": "national"
    }
    
    response = requests.post(f"{BASE_URL}/compare", json=payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Received {len(data)} comparisons")
        
        for comp in data:
            print(f"\n  Metric: {comp['metric_name']}")
            print(f"  Your value: {comp['user_value']:,.2f}")
            print(f"  Benchmark: {comp['benchmark_value']:,.2f}")
            print(f"  Difference: {comp['percentage_difference']:+.1f}%")
            print(f"  Percentile rank: {comp['percentile_rank']}th")
            print(f"  Interpretation: {comp['interpretation']}")
            print(f"  {comp['interpretation_text']}")
    else:
        print(f"Error: {response.text}")
    
    return response.status_code == 200


def run_all_tests():
    """Run all API tests."""
    print("=" * 80)
    print("BENCHMARK API MANUAL TESTS")
    print("=" * 80)
    print("\nMake sure the FastAPI server is running:")
    print("  cd ml-models && python -m uvicorn src.api.main:app --reload")
    print("\nPress Enter to start tests...")
    input()
    
    tests = [
        ("Health Check", test_health),
        ("Get Industries", test_get_industries),
        ("Get Industry Info", test_get_industry_info),
        ("Get Metrics", test_get_metrics),
        ("Get Benchmark Data", test_get_benchmark_data),
        ("Compare to Benchmark", test_compare_to_benchmark)
    ]
    
    results = []
    for name, test_func in tests:
        try:
            success = test_func()
            results.append((name, success))
        except Exception as e:
            print(f"ERROR: {e}")
            results.append((name, False))
    
    # Print summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for name, success in results:
        status = "✓ PASS" if success else "✗ FAIL"
        print(f"{status} - {name}")
    
    print(f"\n{passed}/{total} tests passed ({passed/total*100:.0f}%)")
    
    return passed == total


if __name__ == "__main__":
    run_all_tests()
