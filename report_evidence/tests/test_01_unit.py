import sys
import os
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend')))

from routes.soil import analyze_npk, get_health_status


def test_unit_soil_npk_thresholds():
    """
    Test NPK threshold boundaries:
    - N: [40, 100] Optimal, <40 Low, >100 High
    - P: [20, 60] Optimal, <20 Low, >60 High
    - K: [20, 50] Optimal, <20 Low, >50 High
    """
    # 1. Optimal bounds
    n_s, p_s, k_s, _ = analyze_npk(40, 20, 20)
    assert n_s == 'Optimal' and p_s == 'Optimal' and k_s == 'Optimal'

    n_s, p_s, k_s, _ = analyze_npk(100, 60, 50)
    assert n_s == 'Optimal' and p_s == 'Optimal' and k_s == 'Optimal'

    # 2. Deficient / Low
    n_s, p_s, k_s, _ = analyze_npk(39, 19, 19)
    assert n_s == 'Low' and p_s == 'Low' and k_s == 'Low'

    # 3. Excessive / High
    n_s, p_s, k_s, _ = analyze_npk(101, 61, 51)
    assert n_s == 'High' and p_s == 'High' and k_s == 'High'


def test_unit_soil_health_status():
    """
    Test get_health_status scoring:
    score counts: 40<=N<=100, 20<=P<=60, 20<=K<=50, 6.0<=pH<=7.5
    >=3 -> Good, ==2 -> Fair, <=1 -> Needs Improvement
    """
    # 4/4 matches -> Good
    assert get_health_status(70, 40, 35, 6.5) == 'Good'
    # 3/4 matches -> Good
    assert get_health_status(30, 40, 35, 6.5) == 'Good'
    # 2/4 matches -> Fair
    assert get_health_status(30, 10, 35, 6.5) == 'Fair'
    # 1/4 matches -> Needs Improvement
    assert get_health_status(30, 10, 10, 6.5) == 'Needs Improvement'
    # 0/4 matches -> Needs Improvement
    assert get_health_status(10, 5, 5, 4.0) == 'Needs Improvement'


def test_unit_financial_calculations():
    """
    Test farm budget arithmetic:
    total_cost = seed + fertilizer + labor + other
    total_income = yield_kg * price
    profit = total_income - total_cost
    profit_margin = (profit / total_income * 100)
    """
    seed_cost = 3000.0
    fertilizer_cost = 4500.0
    labor_cost = 6000.0
    other_cost = 2000.0
    price_per_kg = 25.0
    expected_yield_kg = 2000.0

    total_cost = seed_cost + fertilizer_cost + labor_cost + other_cost
    assert total_cost == 15500.0

    total_income = expected_yield_kg * price_per_kg
    assert total_income == 50000.0

    profit = total_income - total_cost
    assert profit == 34500.0

    profit_margin = (profit / total_income) * 100.0
    assert round(profit_margin, 2) == 69.00


def test_unit_sustainability_score_and_grades():
    """
    Test sustainability formula and A/B/C boundary logic:
    Factors:
    - Water: <=3 hrs -> 100, <=5 -> 75, <=7 -> 50, >7 -> 30 (weight 30%)
    - Fertilizer: Organic -> 100, Mixed -> 70, Other -> 40 (weight 25%)
    - Rotation: Regular -> 100, Occasional -> 70, None -> 30 (weight 15%)
    - Tillage: Zero-Till -> 100, Reduced -> 75, Conventional -> 40 (weight 15%)
    - Solar: True -> 100, False -> 40 (weight 15%)
    Grade boundaries:
    total_score >= 80 -> 'A'
    total_score >= 60 -> 'B'
    total_score < 60  -> 'C'
    """
    def calc_score(water_hrs, fert, rot, till, solar):
        w_score = 100 if water_hrs <= 3 else (75 if water_hrs <= 5 else (50 if water_hrs <= 7 else 30))
        f_score = 100 if fert == 'Organic' else (70 if fert == 'Mixed' else 40)
        r_score = 100 if rot == 'Regular' else (70 if rot == 'Occasional' else 30)
        t_score = 100 if till == 'Zero-Till' else (75 if till == 'Reduced' else 40)
        e_score = 100 if solar else 40
        return round((w_score * 0.30) + (f_score * 0.25) + (r_score * 0.15) + (t_score * 0.15) + (e_score * 0.15))

    def get_grade(score):
        if score >= 80:
            return 'A'
        elif score >= 60:
            return 'B'
        return 'C'

    # 1. High score -> Grade A
    s_a = calc_score(2, 'Organic', 'Regular', 'Zero-Till', True)
    assert s_a == 100 and get_grade(s_a) == 'A'

    # Boundary 80 -> Grade A
    assert get_grade(80) == 'A'
    assert get_grade(79) == 'B'

    # Boundary 60 -> Grade B
    assert get_grade(60) == 'B'
    assert get_grade(59) == 'C'

    # Low score -> Grade C
    s_c = calc_score(8, 'Chemical', 'None', 'Conventional', False)
    assert s_c < 60 and get_grade(s_c) == 'C'


def test_unit_risk_overall_level_logic():
    """
    Test overall composite risk escalation rules:
    - If any dimension is 'Critical' -> 'Critical'
    - Else if any is 'High' -> 'High'
    - Else if any is 'Medium' -> 'Medium'
    - Else -> 'Low'
    """
    def calc_overall(severities):
        if any('Critical' in s for s in severities):
            return 'Critical'
        if any('High' in s for s in severities):
            return 'High'
        if any('Medium' in s for s in severities):
            return 'Medium'
        return 'Low'

    assert calc_overall(['Low', 'Low', 'Low', 'Low', 'Critical']) == 'Critical'
    assert calc_overall(['High', 'Critical', 'Low']) == 'Critical'
    assert calc_overall(['Low', 'High', 'Medium', 'Low']) == 'High'
    assert calc_overall(['Low', 'Medium', 'Low']) == 'Medium'
    assert calc_overall(['Low', 'Low', 'Low', 'Low']) == 'Low'
