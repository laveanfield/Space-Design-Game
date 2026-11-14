"""Sinh DU LIEU MAU tong hop (data/raw/sample_library.json va .xlsx).
CANH BAO: day la so lieu GIA LAP de chay duoc skeleton. KHONG phai space_mission_library that.
Ngay thi: bo dataset that vao data/raw/ va viet lai mapping."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SHEETS = {
    "Scenarios": [
        {"Scenario ID": "SC-01", "Name": "First Eyes on Earth", "Mission Type": "earth_imaging", "Budget (M$)": 12,
         "Min Science (pts)": 10, "Min Life (years)": 1, "Deadline (months)": 18,
         "Allowed Orbits": "ORB-LEO-400;ORB-LEO-500", "Learning Goal": "power and data trade-offs"},
        {"Scenario ID": "SC-03", "Name": "Space Weather Sentinel", "Mission Type": "space_weather", "Budget (M$)": 150,
         "Min Science (pts)": 20, "Min Life (years)": 3, "Deadline (months)": 48,
         "Allowed Orbits": "ORB-MEO-20200", "Learning Goal": "radiation hardening and delta-v"},
        {"Scenario ID": "SC-04", "Name": "Greenhouse Gas Monitor", "Mission Type": "ghg_monitoring", "Budget (M$)": 300,
         "Min Science (pts)": 70, "Min Life (years)": 5, "Deadline (months)": 60,
         "Allowed Orbits": "ORB-SSO-600", "Learning Goal": "pointing accuracy and radiation"},
    ],
    "Orbits": [
        {"Orbit ID": "ORB-LEO-400", "Name": "LEO 400 km (ISS-like)", "Class": "LEO", "Altitude (km)": 400,
         "Inclination (deg)": 51.6, "Eclipse Fraction": 0.35, "Ground Contact (min/day)": 40, "Radiation (krad/yr)": 1.0,
         "Lifetime No Reboost (yr)": 2, "LV Payload Factor": 1.0, "Description": "Easy to reach; drag pulls it down in about 2 years"},
        {"Orbit ID": "ORB-LEO-500", "Name": "LEO 500 km", "Class": "LEO", "Altitude (km)": 500,
         "Inclination (deg)": 45.0, "Eclipse Fraction": 0.36, "Ground Contact (min/day)": 45, "Radiation (krad/yr)": 1.5,
         "Lifetime No Reboost (yr)": 8, "LV Payload Factor": 0.95, "Description": "Lives longer than 400 km, a little harder to reach"},
        {"Orbit ID": "ORB-SSO-600", "Name": "Sun-synchronous 600 km (10:30)", "Class": "SSO", "Altitude (km)": 600,
         "Inclination (deg)": 97.79, "Eclipse Fraction": 0.30, "Ground Contact (min/day)": 60, "Radiation (krad/yr)": 3.0,
         "Lifetime No Reboost (yr)": 25, "LV Payload Factor": 0.77, "Description": "Same local time on every pass; good for imaging"},
        {"Orbit ID": "ORB-MEO-20200", "Name": "MEO 20,200 km", "Class": "MEO", "Altitude (km)": 20200,
         "Inclination (deg)": 55.0, "Eclipse Fraction": 0.05, "Ground Contact (min/day)": 300, "Radiation (krad/yr)": 40,
         "Lifetime No Reboost (yr)": 1000, "LV Payload Factor": 0.3, "Description": "Crosses the radiation belts; needs hardened electronics"},
    ],
    "Instruments": [
        {"Instrument ID": "INS-01", "Name": "Compact RGB Camera", "Tier": "basic", "Science Value (pts)": 10,
         "Mass (kg)": 1.2, "Operating Power (W)": 4.0, "Data (GB/day)": 0.4, "Pointing (deg)": 1.0, "Cost (M$)": 1.5,
         "Lead Time (months)": 6, "Compatible Orbits": "ORB-LEO-400;ORB-LEO-500;ORB-SSO-600", "Vendor Note": "ignored column"},
        {"Instrument ID": "INS-04", "Name": "Hyperspectral Imager", "Tier": "advanced", "Science Value (pts)": 70,
         "Mass (kg)": 120, "Operating Power (W)": 100, "Data (GB/day)": 40, "Pointing (deg)": 0.05, "Cost (M$)": 100,
         "Lead Time (months)": 30, "Compatible Orbits": "ORB-SSO-600;ORB-LEO-500", "Vendor Note": ""},
        {"Instrument ID": "INS-07", "Name": "Fluxgate Magnetometer", "Tier": "basic", "Science Value (pts)": 20,
         "Mass (kg)": 0.8, "Operating Power (W)": 1.0, "Data (GB/day)": 0.001, "Pointing (deg)": 10, "Cost (M$)": 1.0,
         "Lead Time (months)": 6, "Compatible Orbits": "ORB-LEO-400;ORB-LEO-500;ORB-SSO-600;ORB-MEO-20200", "Vendor Note": ""},
    ],
    "Buses": [
        {"Bus ID": "BUS-3U", "Name": "3U CubeSat Bus", "Class": "cubesat", "Structure Mass (kg)": 1.5,
         "Max Total Mass (kg)": 6, "Size (m)": 0.3, "Cost (M$)": 0.5, "Lead Time (months)": 4},
        {"Bus ID": "BUS-ESPA", "Name": "ESPA-class Microsat Bus", "Class": "microsat", "Structure Mass (kg)": 30,
         "Max Total Mass (kg)": 300, "Size (m)": 1.0, "Cost (M$)": 8, "Lead Time (months)": 18},
    ],
    "Power Arrays": [
        {"Power ID": "PWR-SA-BODY", "Name": "Body-mounted Solar Cells", "Kind": "body", "Generation (W)": 3,
         "Mass (g)": 200, "Cost (M$)": 0.1, "Lead Time (months)": 3},
        {"Power ID": "PWR-SA-DEP", "Name": "Deployable Solar Panels (6U-12U)", "Kind": "deployable", "Generation (W)": 20,
         "Mass (g)": 600, "Cost (M$)": 0.3, "Lead Time (months)": 6},
        {"Power ID": "PWR-SA-LARGE", "Name": "Large LEO Solar Array (2.5 kW)", "Kind": "deployable", "Generation (W)": 2500,
         "Mass (g)": 40000, "Cost (M$)": 10, "Lead Time (months)": 24},
    ],
    "Batteries": [
        {"Battery ID": "BAT-S", "Name": "Small Li-ion Battery (40 Wh)", "Capacity (Wh)": 40, "Mass (g)": 300,
         "Cost (M$)": 0.2, "Lead Time (months)": 3},
        {"Battery ID": "BAT-L", "Name": "Large Li-ion Battery (1 kWh)", "Capacity (Wh)": 1000, "Mass (g)": 15000,
         "Cost (M$)": 2, "Lead Time (months)": 12},
    ],
    "Comms": [
        {"Comm ID": "COM-UHF", "Name": "UHF Beacon Radio", "Band": "UHF", "Gain (dBi)": 0, "Tx Power (W)": 1,
         "Downlink (Mbps)": 0.0096, "Pointing Required (deg)": 90, "Max Range (km)": 2500, "Mass (kg)": 0.1,
         "Power (W)": 2, "Cost (M$)": 0.1, "Lead Time (months)": 3},
        {"Comm ID": "COM-S-CUBE", "Name": "S-band CubeSat Transmitter", "Band": "S", "Gain (dBi)": 6, "Tx Power (W)": 2,
         "Downlink (Mbps)": 2.0, "Pointing Required (deg)": 20, "Max Range (km)": 3000, "Mass (kg)": 0.3,
         "Power (W)": 5, "Cost (M$)": 0.4, "Lead Time (months)": 6},
        {"Comm ID": "COM-OPT-LEO", "Name": "Optical (Laser) Terminal", "Band": "optical", "Gain (dBi)": 110, "Tx Power (W)": 5,
         "Downlink (Mbps)": 1000, "Pointing Required (deg)": 0.01, "Max Range (km)": 2500, "Mass (kg)": 8,
         "Power (W)": 30, "Cost (M$)": 8, "Lead Time (months)": 24},
    ],
    "Avionics": [
        {"Avionics ID": "OBC-CUBE", "Name": "CubeSat Linux Computer", "Type": "obc", "Rad Tolerance (krad)": 10,
         "Pointing Accuracy (deg)": None, "Torque (mN*m)": None, "Mass (kg)": 0.2, "Power (W)": 1.5, "Cost (M$)": 0.1, "Lead Time (months)": 3},
        {"Avionics ID": "OBC-SPACE", "Name": "Space-grade Processor Board", "Type": "obc", "Rad Tolerance (krad)": 50,
         "Pointing Accuracy (deg)": None, "Torque (mN*m)": None, "Mass (kg)": 1.0, "Power (W)": 5, "Cost (M$)": 1.0, "Lead Time (months)": 12},
        {"Avionics ID": "OBC-RADHARD", "Name": "Rad-hard Flight Computer", "Type": "obc", "Rad Tolerance (krad)": 300,
         "Pointing Accuracy (deg)": None, "Torque (mN*m)": None, "Mass (kg)": 2.0, "Power (W)": 8, "Cost (M$)": 6, "Lead Time (months)": 18},
        {"Avionics ID": "ADCS-WHEEL", "Name": "3-axis Reaction Wheels", "Type": "adcs", "Rad Tolerance (krad)": None,
         "Pointing Accuracy (deg)": 0.5, "Torque (mN*m)": 1.0, "Mass (kg)": 0.5, "Power (W)": 2.5, "Cost (M$)": 0.4, "Lead Time (months)": 6},
        {"Avionics ID": "ADCS-FINE", "Name": "Fine-pointing System", "Type": "adcs", "Rad Tolerance (krad)": None,
         "Pointing Accuracy (deg)": 0.001, "Torque (mN*m)": 5.0, "Mass (kg)": 3.0, "Power (W)": 20, "Cost (M$)": 2.5, "Lead Time (months)": 18},
        {"Avionics ID": "ADCS-MAG", "Name": "Magnetorquers", "Type": "adcs", "Rad Tolerance (krad)": None,
         "Pointing Accuracy (deg)": 5.0, "Torque (mN*m)": 0.2, "Mass (kg)": 0.3, "Power (W)": 0.5, "Cost (M$)": 0.2, "Lead Time (months)": 3},
    ],
    "Launch Vehicles": [
        {"LV ID": "LV-ELECTRON", "Name": "Electron", "Height (m)": 18, "Diameter (m)": 1.2, "Liftoff Mass (t)": 13,
         "Stages": 2, "Propulsion": "liquid", "Fuel": "kerolox", "LEO Capacity (kg)": 300, "Cost (M$)": 7.5,
         "Compatible Sites": "SITE-MAHIA"},
        {"LV ID": "LV-VEGAC", "Name": "Vega-C", "Height (m)": 35, "Diameter (m)": 3.4, "Liftoff Mass (t)": 210,
         "Stages": 4, "Propulsion": "solid+liquid", "Fuel": "solid / hypergolic", "LEO Capacity (kg)": 3000, "Cost (M$)": 30,
         "Compatible Sites": "SITE-KOUROU"},
    ],
    "Launch Sites": [
        {"Site ID": "SITE-MAHIA", "Name": "Rocket Lab LC-1 (Mahia)", "Latitude (deg)": -39.26, "Longitude (deg)": 177.86},
        {"Site ID": "SITE-KOUROU", "Name": "Guiana Space Centre (Kourou)", "Latitude (deg)": 5.24, "Longitude (deg)": -52.77},
    ],
}


def main():
    raw = ROOT / "data" / "raw"
    raw.mkdir(parents=True, exist_ok=True)
    doc = {"_notice": "DU LIEU MAU TONG HOP - khong phai space_mission_library that", "sheets": SHEETS}
    (raw / "sample_library.json").write_text(json.dumps(doc, ensure_ascii=False, indent=1), encoding="utf-8")
    try:
        from openpyxl import Workbook
    except ImportError:
        print("khong co openpyxl: bo qua .xlsx")
        return
    wb = Workbook()
    wb.remove(wb.active)
    for name, rows in SHEETS.items():
        ws = wb.create_sheet(name)
        heads = list(rows[0].keys())
        ws.append(heads)
        for r in rows:
            ws.append([r.get(h) for h in heads])
    wb.save(raw / "sample_library.xlsx")
    print("da ghi sample_library.json va .xlsx")


if __name__ == "__main__":
    sys.exit(main())
