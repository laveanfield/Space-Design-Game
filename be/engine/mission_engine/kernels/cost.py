"""K-COST: chi phi va tien do."""
MANIFEST = {"id": "K-COST", "equations": ["cost = sum(cost_musd)", "schedule = max(lead_time_months)"],
            "assumptions": ["khong mo hinh rui ro vuot ngan sach"], "valid_range": "-", "refs": [], "tests": ["sums"]}


def total_musd(items):
    return float(sum(i.get("cost_musd", 0.0) for i in items))


def schedule_months(items):
    return float(max((i.get("lead_time_months", 0) for i in items), default=0))
