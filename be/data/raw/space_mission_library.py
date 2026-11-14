"""
space_mission_library.py - định nghĩa dữ liệu vật phẩm (sinh từ space_mission_library.xlsx).
Mỗi biến là một tab; khoá của dict = item_id.
Ghi chú: payload_to_*_kg lấy từ sheet LV_Payload (None = không có dữ liệu).
"""

launch_vehicles = {
    "LV-ELECTRON": {
        # Identification
        "item_id": "LV-ELECTRON",
        "item_name": "Electron",
        "variant": "Standard",
        "manufacturer": "Rocket Lab",
        "country": "USA / New Zealand",

        # Physical specifications
        "height_m": 18,
        "diameter_m": 1.2,
        "liftoff_mass_kg": 13000,
        "fairing_diameter_m": 1.2,

        # Payload capacity
        "payload_to_leo_kg": 300,
        "payload_to_gto_kg": None,
        "payload_to_sso_kg": 200,

        # Configuration
        "number_of_stages": "2 (+ optional Kick Stage)",
        "reusable": "No (booster recovery experimental)",
        "status": "Active",

        # Propulsion
        "propulsion_system": "Stage 1: 9x Rutherford; Stage 2: 1x Rutherford Vacuum",
        "propellant": "LOX / RP-1 (kerosene)",

        # Game stats
        "cost_per_launch_musd": 7.5,
        "reliability_game": 0.95,
        "lead_time_months": 6,

        # Launch sites
        "launch_site_ids": [
            "SITE-MAHIA",
            "SITE-WALLOPS",
        ],

        # Source
        "source_url": "https://rocketlabcorp.com/launch/",
        "source_url_2": "https://rocketlabcorp.com/launch/electron/",
        "data_quality": "official (dims, mass, LEO); game_estimate (cost, reliability, lead time)",
        "notes": "No GTO capability. Cost ~US$7.5M from secondary sources (Wikipedia).",
    },
    "LV-ARIANE62": {
        # Identification
        "item_id": "LV-ARIANE62",
        "item_name": "Ariane 6",
        "variant": "A62 (2x P120C)",
        "manufacturer": "ArianeGroup / Arianespace",
        "country": "Europe (ESA)",

        # Physical specifications
        "height_m": 63,
        "diameter_m": 5.4,
        "liftoff_mass_kg": 540000,
        "fairing_diameter_m": 5.4,

        # Payload capacity
        "payload_to_leo_kg": 10300,
        "payload_to_gto_kg": 4500,
        "payload_to_sso_kg": 7200,

        # Configuration
        "number_of_stages": "2 (+ 2 solid boosters)",
        "reusable": "No",
        "status": "Active",

        # Propulsion
        "propulsion_system": "Core: 1x Vulcain 2.1; Upper: 1x Vinci; 2x P120C solid boosters",
        "propellant": "LH2 / LOX (core + upper); solid HTPB/AP/Al (boosters)",

        # Game stats
        "cost_per_launch_musd": 95,
        "reliability_game": 0.97,
        "lead_time_months": 18,

        # Launch sites
        "launch_site_ids": ["SITE-KOUROU"],

        # Source
        "source_url": "https://cnes.fr/en/news/new-ariane-6-four-booster-a64-variant-changes-game",
        "source_url_2": "https://www.esa.int/Our_Activities/Space_Transportation/Launch_vehicles/Ariane_6",
        "data_quality": "official (mass, payload); secondary (height 63 m); game_estimate (cost, reliability, lead time)",
        "notes": "Liftoff mass 540 t per CNES (other docs: 530 t). Height 63 m not confirmed on ESA/ArianeGroup pages - check Ariane 6 User's Manual. Cost: EUR 70-100M range in secondary sources.",
    },
    "LV-ARIANE64": {
        # Identification
        "item_id": "LV-ARIANE64",
        "item_name": "Ariane 6",
        "variant": "A64 (4x P120C)",
        "manufacturer": "ArianeGroup / Arianespace",
        "country": "Europe (ESA)",

        # Physical specifications
        "height_m": 63,
        "diameter_m": 5.4,
        "liftoff_mass_kg": 870000,
        "fairing_diameter_m": 5.4,

        # Payload capacity
        "payload_to_leo_kg": 21600,
        "payload_to_gto_kg": 11500,
        "payload_to_sso_kg": 15500,

        # Configuration
        "number_of_stages": "2 (+ 4 solid boosters)",
        "reusable": "No",
        "status": "Active",

        # Propulsion
        "propulsion_system": "Core: 1x Vulcain 2.1; Upper: 1x Vinci; 4x P120C solid boosters",
        "propellant": "LH2 / LOX (core + upper); solid HTPB/AP/Al (boosters)",

        # Game stats
        "cost_per_launch_musd": 125,
        "reliability_game": 0.96,
        "lead_time_months": 24,

        # Launch sites
        "launch_site_ids": ["SITE-KOUROU"],

        # Source
        "source_url": "https://cnes.fr/en/news/new-ariane-6-four-booster-a64-variant-changes-game",
        "source_url_2": "https://ariane.group/en/news/number-crunching-ariane-6-ariane-62-and-ariane-64/",
        "data_quality": "official (mass, payload); secondary (height 63 m); game_estimate (cost, reliability, lead time)",
        "notes": "Liftoff mass 870 t per CNES (other docs: 860 t). First A64 flight Feb 2026. EUR 115M (2018 est.) in secondary sources.",
    },
    "LV-VEGAC": {
        # Identification
        "item_id": "LV-VEGAC",
        "item_name": "Vega-C",
        "variant": "Standard",
        "manufacturer": "Avio (ESA / Arianespace)",
        "country": "Europe (Italy-led)",

        # Physical specifications
        "height_m": 35,
        "diameter_m": 3.4,
        "liftoff_mass_kg": 210000,
        "fairing_diameter_m": 3.3,

        # Payload capacity
        "payload_to_leo_kg": 3300,
        "payload_to_gto_kg": None,
        "payload_to_sso_kg": 2300,

        # Configuration
        "number_of_stages": 4,
        "reusable": "No",
        "status": "Active",

        # Propulsion
        "propulsion_system": "Stages 1-3: P120C, Zefiro-40, Zefiro-9 (solid); Stage 4: AVUM+ (1x liquid engine)",
        "propellant": "Solid HTPB (stages 1-3); UDMH / N2O4 (AVUM+)",

        # Game stats
        "cost_per_launch_musd": 40,
        "reliability_game": 0.88,
        "lead_time_months": 18,

        # Launch sites
        "launch_site_ids": ["SITE-KOUROU"],

        # Source
        "source_url": "https://www.esa.int/Enabling_Support/Space_Transportation/Launch_vehicles/Vega-C",
        "source_url_2": "https://arianespace.com/?p=224",
        "data_quality": "official (height, mass, payload); secondary (diameter, propellants); game_estimate (cost, reliability, lead time)",
        "notes": "Diameter 3.4 m is the P120C stage (Wikipedia); ESA gives fairing 3.3 m, Arianespace 3.5 m. Cost not found in sources - rough estimate.",
    },
    "LV-LVM3": {
        # Identification
        "item_id": "LV-LVM3",
        "item_name": "LVM3",
        "variant": "Standard",
        "manufacturer": "ISRO",
        "country": "India",

        # Physical specifications
        "height_m": 43.5,
        "diameter_m": 4,
        "liftoff_mass_kg": 640000,
        "fairing_diameter_m": 5,

        # Payload capacity
        "payload_to_leo_kg": 8000,
        "payload_to_gto_kg": 4000,
        "payload_to_sso_kg": None,

        # Configuration
        "number_of_stages": "3 (incl. 2 strap-on boosters)",
        "reusable": "No",
        "status": "Active",

        # Propulsion
        "propulsion_system": "2x S200 solid; L110 core: 2x Vikas; C25 upper: 1x CE-20 (cryogenic)",
        "propellant": "S200: HTPB solid; L110: UDMH-based liquid (ISRO page says 'UDMH + H2O' - verify; commonly UDMH/N2O4); C25: LOX / LH2",

        # Game stats
        "cost_per_launch_musd": 42,
        "reliability_game": 0.97,
        "lead_time_months": 24,

        # Launch sites
        "launch_site_ids": ["SITE-SRIHARIKOTA"],

        # Source
        "source_url": "https://www.isro.gov.in/GSLVmk3_CON.html",
        "source_url_2": None,
        "data_quality": "official (dims, mass, payload); game_estimate (cost, reliability, lead time)",
        "notes": "ISRO: 8,000 kg LEO (600 km), 4,000 kg GTO. Wikipedia lists 10,000 / 4,200 kg. Cost INR 402 crore (~US$42M) per Wikipedia.",
    },
    "LV-VULCAN-VC6": {
        # Identification
        "item_id": "LV-VULCAN-VC6",
        "item_name": "Vulcan Centaur",
        "variant": "VC6 (6x GEM-63XL)",
        "manufacturer": "United Launch Alliance (ULA)",
        "country": "USA",

        # Physical specifications
        "height_m": 61.6,
        "diameter_m": 5.4,
        "liftoff_mass_kg": 546700,
        "fairing_diameter_m": 5.4,

        # Payload capacity
        "payload_to_leo_kg": 27200,
        "payload_to_gto_kg": 14500,
        "payload_to_sso_kg": 22300,

        # Configuration
        "number_of_stages": "2 (+ 0/2/4/6 solid boosters)",
        "reusable": "No",
        "status": "Active",

        # Propulsion
        "propulsion_system": "Booster: 2x BE-4; Centaur V: 2x RL10C; up to 6x GEM-63XL solid",
        "propellant": "Booster: LOX / LNG (methane); Centaur: LOX / LH2; solid boosters",

        # Game stats
        "cost_per_launch_musd": 110,
        "reliability_game": 0.95,
        "lead_time_months": 18,

        # Launch sites
        "launch_site_ids": [
            "SITE-CAPE",
            "SITE-VANDENBERG",
        ],

        # Source
        "source_url": "https://www.ulalaunch.com/docs/default-source/rockets/vulcancentaur.pdf",
        "source_url_2": None,
        "data_quality": "official (height, diameter, payload range); secondary (liftoff mass); game_estimate (cost, reliability, lead time)",
        "notes": "Height 61.6 m with standard fairing, 67.4 m with long fairing. ULA only publishes ranges across configs (LEO 10,800-27,200; GTO 3,500-14,500); VC6 uses the upper end. Liftoff mass 546,700 kg from Wikipedia. Cost US$100-200M in secondary sources.",
    },
    "LV-NEWGLENN": {
        # Identification
        "item_id": "LV-NEWGLENN",
        "item_name": "New Glenn",
        "variant": "7x2",
        "manufacturer": "Blue Origin",
        "country": "USA",

        # Physical specifications
        "height_m": 98,
        "diameter_m": 7,
        "liftoff_mass_kg": None,
        "fairing_diameter_m": 7,

        # Payload capacity
        "payload_to_leo_kg": 45000,
        "payload_to_gto_kg": 13000,
        "payload_to_sso_kg": None,

        # Configuration
        "number_of_stages": 2,
        "reusable": "Yes (first stage, designed for >=25 flights)",
        "status": "Active",

        # Propulsion
        "propulsion_system": "Stage 1: 7x BE-4; Stage 2: 2x BE-3U",
        "propellant": "Stage 1: LOX / LNG; Stage 2: LOX / LH2",

        # Game stats
        "cost_per_launch_musd": 90,
        "reliability_game": 0.9,
        "lead_time_months": 18,

        # Launch sites
        "launch_site_ids": ["SITE-CAPE"],

        # Source
        "source_url": "https://www.blueorigin.com/new-glenn",
        "source_url_2": None,
        "data_quality": "official (height, diameter, payload); not published (liftoff mass); game_estimate (cost, reliability, lead time)",
        "notes": "Blue Origin does not publish liftoff mass. Payload 45 t LEO / >13 t GTO. Cost US$68-110M in secondary sources. 9x4 variant announced.",
    },
    "LV-H3-24L": {
        # Identification
        "item_id": "LV-H3-24L",
        "item_name": "H3",
        "variant": "H3-24L (4x SRB-3, long fairing)",
        "manufacturer": "JAXA / Mitsubishi Heavy Industries",
        "country": "Japan",

        # Physical specifications
        "height_m": 63,
        "diameter_m": 5.2,
        "liftoff_mass_kg": 574000,
        "fairing_diameter_m": 5.2,

        # Payload capacity
        "payload_to_leo_kg": 16500,
        "payload_to_gto_kg": 6500,
        "payload_to_sso_kg": None,

        # Configuration
        "number_of_stages": "2 (+ 4 solid boosters)",
        "reusable": "No",
        "status": "Active",

        # Propulsion
        "propulsion_system": "Stage 1: 2x LE-9; Stage 2: 1x LE-5B-3; 4x SRB-3 solid",
        "propellant": "LH2 / LOX; solid boosters (SRB-3)",

        # Game stats
        "cost_per_launch_musd": 65,
        "reliability_game": 0.85,
        "lead_time_months": 24,

        # Launch sites
        "launch_site_ids": ["SITE-TANEGASHIMA"],

        # Source
        "source_url": "https://www.jaxa.jp/projects/pr/brochure/pdf/01/rocket09.pdf",
        "source_url_2": "https://www.mhi.com/business/products-services/space-defense/launch-service/launch-vehicles",
        "data_quality": "official (dims, mass, GTO); game_estimate (cost, reliability, lead time)",
        "notes": "JAXA brochure: 63 m, core 5.2 m, 574 t (H3-24L), GTO >=6.5 t at dV=1,500 m/s (not standard GTO). MHI: 575 t. LEO payload not published in JAXA/MHI sources found. US$50M quoted for H3-30S only.",
    },
}

launch_sites = {
    "SITE-KOUROU": {
        # Identification
        "item_id": "SITE-KOUROU",
        "item_name": "Guiana Space Centre (Kourou)",
        "country": "France (French Guiana)",
        "operator": "CNES / ESA / Arianespace",

        # Location
        "latitude_deg": 5.24,
        "longitude_deg": -52.77,

        # Compatibility
        "supported_vehicle_ids": [
            "LV-ARIANE62",
            "LV-ARIANE64",
            "LV-VEGAC",
        ],
        "typical_orbits": [
            "GTO",
            "SSO",
            "LEO",
        ],

        # Game stats
        "game_cost_multiplier": 1,

        # Source
        "data_quality": "reference (approx. coordinates); game_estimate (multiplier)",
        "notes": "Near-equator: efficient for GTO.",
    },
    "SITE-CAPE": {
        # Identification
        "item_id": "SITE-CAPE",
        "item_name": "Cape Canaveral SFS",
        "country": "USA (Florida)",
        "operator": "US Space Force",

        # Location
        "latitude_deg": 28.5,
        "longitude_deg": -80.6,

        # Compatibility
        "supported_vehicle_ids": [
            "LV-VULCAN-VC6",
            "LV-NEWGLENN",
        ],
        "typical_orbits": [
            "LEO",
            "GTO",
        ],

        # Game stats
        "game_cost_multiplier": 1,

        # Source
        "data_quality": "reference (approx. coordinates); game_estimate (multiplier)",
        "notes": "Vulcan SLC-41; New Glenn LC-36.",
    },
    "SITE-VANDENBERG": {
        # Identification
        "item_id": "SITE-VANDENBERG",
        "item_name": "Vandenberg SFB",
        "country": "USA (California)",
        "operator": "US Space Force",

        # Location
        "latitude_deg": 34.74,
        "longitude_deg": -120.57,

        # Compatibility
        "supported_vehicle_ids": ["LV-VULCAN-VC6"],
        "typical_orbits": [
            "SSO",
            "polar",
        ],

        # Game stats
        "game_cost_multiplier": 1,

        # Source
        "data_quality": "reference (approx. coordinates); game_estimate (multiplier)",
        "notes": "Polar/SSO launches over open ocean.",
    },
    "SITE-SRIHARIKOTA": {
        # Identification
        "item_id": "SITE-SRIHARIKOTA",
        "item_name": "Satish Dhawan Space Centre",
        "country": "India",
        "operator": "ISRO",

        # Location
        "latitude_deg": 13.72,
        "longitude_deg": 80.23,

        # Compatibility
        "supported_vehicle_ids": ["LV-LVM3"],
        "typical_orbits": [
            "LEO",
            "GTO",
        ],

        # Game stats
        "game_cost_multiplier": 1,

        # Source
        "data_quality": "reference (approx. coordinates); game_estimate (multiplier)",
        "notes": "Sriharikota.",
    },
    "SITE-TANEGASHIMA": {
        # Identification
        "item_id": "SITE-TANEGASHIMA",
        "item_name": "Tanegashima Space Center",
        "country": "Japan",
        "operator": "JAXA",

        # Location
        "latitude_deg": 30.4,
        "longitude_deg": 130.97,

        # Compatibility
        "supported_vehicle_ids": ["LV-H3-24L"],
        "typical_orbits": [
            "GTO",
            "SSO",
            "LEO",
        ],

        # Game stats
        "game_cost_multiplier": 1,

        # Source
        "data_quality": "reference (approx. coordinates); game_estimate (multiplier)",
        "notes": "Yoshinobu pad LA-Y.",
    },
    "SITE-MAHIA": {
        # Identification
        "item_id": "SITE-MAHIA",
        "item_name": "Rocket Lab LC-1 (Mahia)",
        "country": "New Zealand",
        "operator": "Rocket Lab",

        # Location
        "latitude_deg": -39.26,
        "longitude_deg": 177.86,

        # Compatibility
        "supported_vehicle_ids": ["LV-ELECTRON"],
        "typical_orbits": [
            "SSO",
            "LEO",
        ],

        # Game stats
        "game_cost_multiplier": 1,

        # Source
        "data_quality": "reference (approx. coordinates); game_estimate (multiplier)",
        "notes": "Private launch complex.",
    },
    "SITE-WALLOPS": {
        # Identification
        "item_id": "SITE-WALLOPS",
        "item_name": "Rocket Lab LC-2 (Wallops)",
        "country": "USA (Virginia)",
        "operator": "Rocket Lab / NASA Wallops",

        # Location
        "latitude_deg": 37.83,
        "longitude_deg": -75.49,

        # Compatibility
        "supported_vehicle_ids": ["LV-ELECTRON"],
        "typical_orbits": ["LEO"],

        # Game stats
        "game_cost_multiplier": 1,

        # Source
        "data_quality": "reference (approx. coordinates); game_estimate (multiplier)",
        "notes": "Mid-Atlantic Regional Spaceport.",
    },
}

spacecraft_buses = {
    "BUS-3U": {
        # Identification
        "item_id": "BUS-3U",
        "item_name": "3U CubeSat Bus",
        "class": "Nano",
        "form_factor": "3U",
        "real_analog": "Standard 3U CubeSat",
        "tier": "basic",

        # Mass limits
        "structure_mass_kg": 1,
        "max_total_mass_kg": 6,
        "max_payload_mass_kg": 2,

        # Power
        "max_payload_power_w": 6,
        "housekeeping_power_w": 1,

        # Performance
        "design_life_years": 1.5,
        "onboard_delta_v_mps": 0,

        # Game stats
        "cost_musd": 0.4,
        "lead_time_months": 6,

        # Description
        "description_simple": "Tiny and cheap, but very little power and room.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": "structure_mass_kg includes structure, thermal, harness and any onboard propulsion for the listed delta-v.",
    },
    "BUS-6U": {
        # Identification
        "item_id": "BUS-6U",
        "item_name": "6U CubeSat Bus",
        "class": "Nano",
        "form_factor": "6U",
        "real_analog": "Standard 6U CubeSat",
        "tier": "basic",

        # Mass limits
        "structure_mass_kg": 2.5,
        "max_total_mass_kg": 12,
        "max_payload_mass_kg": 6,

        # Power
        "max_payload_power_w": 25,
        "housekeeping_power_w": 2.5,

        # Performance
        "design_life_years": 2.5,
        "onboard_delta_v_mps": 30,

        # Game stats
        "cost_musd": 1.2,
        "lead_time_months": 9,

        # Description
        "description_simple": "Room for a real instrument and a little maneuvering.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": "structure_mass_kg includes structure, thermal, harness and any onboard propulsion for the listed delta-v.",
    },
    "BUS-12U": {
        # Identification
        "item_id": "BUS-12U",
        "item_name": "12U CubeSat Bus",
        "class": "Nano",
        "form_factor": "12U",
        "real_analog": "Standard 12U CubeSat",
        "tier": "basic",

        # Mass limits
        "structure_mass_kg": 5,
        "max_total_mass_kg": 24,
        "max_payload_mass_kg": 12,

        # Power
        "max_payload_power_w": 50,
        "housekeeping_power_w": 5,

        # Performance
        "design_life_years": 3,
        "onboard_delta_v_mps": 100,

        # Game stats
        "cost_musd": 3,
        "lead_time_months": 12,

        # Description
        "description_simple": "The largest CubeSat: more payload, still low cost.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": "structure_mass_kg includes structure, thermal, harness and any onboard propulsion for the listed delta-v.",
    },
    "BUS-ESPA": {
        # Identification
        "item_id": "BUS-ESPA",
        "item_name": "ESPA-class Microsat Bus",
        "class": "Micro",
        "form_factor": "~180 kg class",
        "real_analog": "ESPA-ring microsatellite class",
        "tier": "advanced",

        # Mass limits
        "structure_mass_kg": 45,
        "max_total_mass_kg": 180,
        "max_payload_mass_kg": 70,

        # Power
        "max_payload_power_w": 150,
        "housekeeping_power_w": 15,

        # Performance
        "design_life_years": 5,
        "onboard_delta_v_mps": 200,

        # Game stats
        "cost_musd": 18,
        "lead_time_months": 24,

        # Description
        "description_simple": "A proper small satellite that fits many rideshares.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": "structure_mass_kg includes structure, thermal, harness and any onboard propulsion for the listed delta-v.",
    },
    "BUS-SMALL500": {
        # Identification
        "item_id": "BUS-SMALL500",
        "item_name": "500 kg-class Small Satellite Bus",
        "class": "Small",
        "form_factor": "~500 kg class",
        "real_analog": "Typical small Earth-observation satellite class",
        "tier": "advanced",

        # Mass limits
        "structure_mass_kg": 130,
        "max_total_mass_kg": 500,
        "max_payload_mass_kg": 200,

        # Power
        "max_payload_power_w": 500,
        "housekeeping_power_w": 40,

        # Performance
        "design_life_years": 7,
        "onboard_delta_v_mps": 400,

        # Game stats
        "cost_musd": 60,
        "lead_time_months": 30,

        # Description
        "description_simple": "A flexible mid-size bus for serious science.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": "structure_mass_kg includes structure, thermal, harness and any onboard propulsion for the listed delta-v.",
    },
    "BUS-LARGE-LEO": {
        # Identification
        "item_id": "BUS-LARGE-LEO",
        "item_name": "Large LEO Observatory Bus",
        "class": "Large",
        "form_factor": "~2,000 kg class",
        "real_analog": "Large LEO Earth-observation satellite class",
        "tier": "expert",

        # Mass limits
        "structure_mass_kg": 500,
        "max_total_mass_kg": 2000,
        "max_payload_mass_kg": 800,

        # Power
        "max_payload_power_w": 2500,
        "housekeeping_power_w": 120,

        # Performance
        "design_life_years": 10,
        "onboard_delta_v_mps": 600,

        # Game stats
        "cost_musd": 220,
        "lead_time_months": 48,

        # Description
        "description_simple": "Big power and payload budget, big price.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": "structure_mass_kg includes structure, thermal, harness and any onboard propulsion for the listed delta-v.",
    },
    "BUS-GEO": {
        # Identification
        "item_id": "BUS-GEO",
        "item_name": "GEO-class Bus",
        "class": "Large",
        "form_factor": "~4,000 kg class",
        "real_analog": "Commercial/weather GEO satellite class",
        "tier": "expert",

        # Mass limits
        "structure_mass_kg": 900,
        "max_total_mass_kg": 4000,
        "max_payload_mass_kg": 1000,

        # Power
        "max_payload_power_w": 5000,
        "housekeeping_power_w": 200,

        # Performance
        "design_life_years": 15,
        "onboard_delta_v_mps": 1800,

        # Game stats
        "cost_musd": 450,
        "lead_time_months": 60,

        # Description
        "description_simple": "Built to reach and hold geostationary orbit for 15 years.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": "structure_mass_kg includes structure, thermal, harness and any onboard propulsion for the listed delta-v.",
    },
}

power_systems = {
    "PWR-SA-BODY": {
        # Identification
        "item_id": "PWR-SA-BODY",
        "item_name": "Body-Mounted Solar Cells (3U)",
        "type": "solar_array",
        "real_analog": "CubeSat body-mounted GaAs cells",
        "tier": "basic",

        # Solar array specs
        "power_output_w_1au": 12,
        "area_m2": 0.06,
        "efficiency_pct": 28,
        "degradation_pct_per_year": 2,

        # Battery specs
        "capacity_wh": None,
        "usable_dod": None,
        "cycle_life": None,

        # Physical specifications
        "mass_kg": 0.3,

        # Game stats
        "cost_musd": 0.25,
        "lead_time_months": 4,

        # Description
        "description_simple": "Cells glued to the satellite body: simple but low power.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "PWR-SA-DEP": {
        # Identification
        "item_id": "PWR-SA-DEP",
        "item_name": "Deployable Solar Panels (6U-12U)",
        "type": "solar_array",
        "real_analog": "CubeSat deployable panels",
        "tier": "basic",

        # Solar array specs
        "power_output_w_1au": 60,
        "area_m2": 0.24,
        "efficiency_pct": 28,
        "degradation_pct_per_year": 2,

        # Battery specs
        "capacity_wh": None,
        "usable_dod": None,
        "cycle_life": None,

        # Physical specifications
        "mass_kg": 1.5,

        # Game stats
        "cost_musd": 1,
        "lead_time_months": 6,

        # Description
        "description_simple": "Fold-out wings that catch more sunlight.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "PWR-SA-SMALL": {
        # Identification
        "item_id": "PWR-SA-SMALL",
        "item_name": "SmallSat Solar Array (350 W)",
        "type": "solar_array",
        "real_analog": "Small satellite triple-junction array",
        "tier": "advanced",

        # Solar array specs
        "power_output_w_1au": 350,
        "area_m2": 1.05,
        "efficiency_pct": 29,
        "degradation_pct_per_year": 1.5,

        # Battery specs
        "capacity_wh": None,
        "usable_dod": None,
        "cycle_life": None,

        # Physical specifications
        "mass_kg": 11,

        # Game stats
        "cost_musd": 4,
        "lead_time_months": 9,

        # Description
        "description_simple": "Enough power for a mid-size instrument.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "PWR-SA-LARGE": {
        # Identification
        "item_id": "PWR-SA-LARGE",
        "item_name": "Large LEO Solar Array (2.5 kW)",
        "type": "solar_array",
        "real_analog": "Large LEO satellite array",
        "tier": "expert",

        # Solar array specs
        "power_output_w_1au": 2500,
        "area_m2": 7.5,
        "efficiency_pct": 29,
        "degradation_pct_per_year": 1.5,

        # Battery specs
        "capacity_wh": None,
        "usable_dod": None,
        "cycle_life": None,

        # Physical specifications
        "mass_kg": 65,

        # Game stats
        "cost_musd": 18,
        "lead_time_months": 15,

        # Description
        "description_simple": "Big wings for power-hungry radar and spectrometers.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "PWR-SA-GEO": {
        # Identification
        "item_id": "PWR-SA-GEO",
        "item_name": "GEO Solar Array (6 kW)",
        "type": "solar_array",
        "real_analog": "GEO satellite array",
        "tier": "expert",

        # Solar array specs
        "power_output_w_1au": 6000,
        "area_m2": 18,
        "efficiency_pct": 30,
        "degradation_pct_per_year": 1.5,

        # Battery specs
        "capacity_wh": None,
        "usable_dod": None,
        "cycle_life": None,

        # Physical specifications
        "mass_kg": 150,

        # Game stats
        "cost_musd": 45,
        "lead_time_months": 18,

        # Description
        "description_simple": "Large, long-lived array for geostationary orbit.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "BAT-S": {
        # Identification
        "item_id": "BAT-S",
        "item_name": "Small Li-ion Battery (40 Wh)",
        "type": "battery",
        "real_analog": "CubeSat Li-ion pack",
        "tier": "basic",

        # Solar array specs
        "power_output_w_1au": None,
        "area_m2": None,
        "efficiency_pct": None,
        "degradation_pct_per_year": None,

        # Battery specs
        "capacity_wh": 40,
        "usable_dod": 0.3,
        "cycle_life": 30000,

        # Physical specifications
        "mass_kg": 0.3,

        # Game stats
        "cost_musd": 0.1,
        "lead_time_months": 3,

        # Description
        "description_simple": "Keeps a CubeSat alive in Earth's shadow.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "BAT-M": {
        # Identification
        "item_id": "BAT-M",
        "item_name": "Medium Li-ion Battery (200 Wh)",
        "type": "battery",
        "real_analog": "Small satellite Li-ion pack",
        "tier": "basic",

        # Solar array specs
        "power_output_w_1au": None,
        "area_m2": None,
        "efficiency_pct": None,
        "degradation_pct_per_year": None,

        # Battery specs
        "capacity_wh": 200,
        "usable_dod": 0.3,
        "cycle_life": 30000,

        # Physical specifications
        "mass_kg": 1.4,

        # Game stats
        "cost_musd": 0.4,
        "lead_time_months": 5,

        # Description
        "description_simple": "Good for small satellites in low orbit.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "BAT-L": {
        # Identification
        "item_id": "BAT-L",
        "item_name": "Large Li-ion Battery (1 kWh)",
        "type": "battery",
        "real_analog": "Large satellite Li-ion pack",
        "tier": "advanced",

        # Solar array specs
        "power_output_w_1au": None,
        "area_m2": None,
        "efficiency_pct": None,
        "degradation_pct_per_year": None,

        # Battery specs
        "capacity_wh": 1000,
        "usable_dod": 0.3,
        "cycle_life": 30000,

        # Physical specifications
        "mass_kg": 6.5,

        # Game stats
        "cost_musd": 2,
        "lead_time_months": 8,

        # Description
        "description_simple": "Powers big instruments through eclipse.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "BAT-XL": {
        # Identification
        "item_id": "BAT-XL",
        "item_name": "GEO Battery (8 kWh)",
        "type": "battery",
        "real_analog": "GEO satellite battery",
        "tier": "expert",

        # Solar array specs
        "power_output_w_1au": None,
        "area_m2": None,
        "efficiency_pct": None,
        "degradation_pct_per_year": None,

        # Battery specs
        "capacity_wh": 8000,
        "usable_dod": 0.6,
        "cycle_life": 2000,

        # Physical specifications
        "mass_kg": 55,

        # Game stats
        "cost_musd": 12,
        "lead_time_months": 12,

        # Description
        "description_simple": "Few eclipses in GEO, so it can be discharged deeper.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
}

communications = {
    "COM-UHF": {
        # Identification
        "item_id": "COM-UHF",
        "item_name": "UHF Beacon Radio",
        "band": "UHF",
        "real_analog": "Amateur-band CubeSat radio",
        "tier": "basic",

        # Antenna / RF
        "antenna_gain_dbi": 2,
        "tx_power_w": 1,
        "power_draw_w": 3,

        # Data link
        "data_rate_mbps_at_ref": 0.0096,
        "ref_distance_km": 1500,
        "max_data_rate_mbps": 0.0192,
        "max_range_km": 3000,

        # Operating requirements
        "pointing_required_deg": 30,
        "weather_dependent": False,

        # Physical specifications
        "mass_kg": 0.1,

        # Game stats
        "cost_musd": 0.1,
        "lead_time_months": 3,

        # Description
        "description_simple": "Very slow but very cheap: good for telemetry only.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": "Rate scales with (ref_distance / actual distance)^2, capped at max_data_rate.",
    },
    "COM-S-CUBE": {
        # Identification
        "item_id": "COM-S-CUBE",
        "item_name": "S-band CubeSat Transmitter",
        "band": "S",
        "real_analog": "CubeSat S-band transmitter",
        "tier": "basic",

        # Antenna / RF
        "antenna_gain_dbi": 6,
        "tx_power_w": 2,
        "power_draw_w": 8,

        # Data link
        "data_rate_mbps_at_ref": 2,
        "ref_distance_km": 1500,
        "max_data_rate_mbps": 4,
        "max_range_km": 3000,

        # Operating requirements
        "pointing_required_deg": 10,
        "weather_dependent": False,

        # Physical specifications
        "mass_kg": 0.4,

        # Game stats
        "cost_musd": 0.3,
        "lead_time_months": 4,

        # Description
        "description_simple": "Modest speed for small image downloads.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": "Rate scales with (ref_distance / actual distance)^2, capped at max_data_rate.",
    },
    "COM-X-SMALL": {
        # Identification
        "item_id": "COM-X-SMALL",
        "item_name": "X-band SmallSat Transmitter",
        "band": "X",
        "real_analog": "SmallSat X-band downlink",
        "tier": "advanced",

        # Antenna / RF
        "antenna_gain_dbi": 12,
        "tx_power_w": 10,
        "power_draw_w": 35,

        # Data link
        "data_rate_mbps_at_ref": 50,
        "ref_distance_km": 1500,
        "max_data_rate_mbps": 150,
        "max_range_km": 3000,

        # Operating requirements
        "pointing_required_deg": 3,
        "weather_dependent": False,

        # Physical specifications
        "mass_kg": 3,

        # Game stats
        "cost_musd": 2,
        "lead_time_months": 6,

        # Description
        "description_simple": "Fast enough for multispectral imagery in LEO.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": "Rate scales with (ref_distance / actual distance)^2, capped at max_data_rate.",
    },
    "COM-KA-LEO": {
        # Identification
        "item_id": "COM-KA-LEO",
        "item_name": "Ka-band High-rate LEO Link",
        "band": "Ka",
        "real_analog": "High-rate Ka-band Earth observation downlink",
        "tier": "expert",

        # Antenna / RF
        "antenna_gain_dbi": 30,
        "tx_power_w": 40,
        "power_draw_w": 120,

        # Data link
        "data_rate_mbps_at_ref": 500,
        "ref_distance_km": 1500,
        "max_data_rate_mbps": 1200,
        "max_range_km": 3000,

        # Operating requirements
        "pointing_required_deg": 0.5,
        "weather_dependent": False,

        # Physical specifications
        "mass_kg": 12,

        # Game stats
        "cost_musd": 8,
        "lead_time_months": 12,

        # Description
        "description_simple": "Hundreds of Mbps for radar and hyperspectral data.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": "Rate scales with (ref_distance / actual distance)^2, capped at max_data_rate.",
    },
    "COM-OPT-LEO": {
        # Identification
        "item_id": "COM-OPT-LEO",
        "item_name": "Optical (Laser) Terminal",
        "band": "Optical",
        "real_analog": "Laser communication terminal",
        "tier": "expert",

        # Antenna / RF
        "antenna_gain_dbi": None,
        "tx_power_w": 1,
        "power_draw_w": 90,

        # Data link
        "data_rate_mbps_at_ref": 1000,
        "ref_distance_km": 1500,
        "max_data_rate_mbps": 2000,
        "max_range_km": 3000,

        # Operating requirements
        "pointing_required_deg": 0.01,
        "weather_dependent": True,

        # Physical specifications
        "mass_kg": 10,

        # Game stats
        "cost_musd": 12,
        "lead_time_months": 18,

        # Description
        "description_simple": "Huge speed, but clouds can block the link and pointing must be precise.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": "Rate scales with (ref_distance / actual distance)^2, capped at max_data_rate.",
    },
    "COM-X-MGA": {
        # Identification
        "item_id": "COM-X-MGA",
        "item_name": "X-band Medium-gain Antenna",
        "band": "X",
        "real_analog": "Medium-gain X-band antenna for high orbits",
        "tier": "advanced",

        # Antenna / RF
        "antenna_gain_dbi": 25,
        "tx_power_w": 30,
        "power_draw_w": 90,

        # Data link
        "data_rate_mbps_at_ref": 10,
        "ref_distance_km": 36000,
        "max_data_rate_mbps": 50,
        "max_range_km": 60000,

        # Operating requirements
        "pointing_required_deg": 1,
        "weather_dependent": False,

        # Physical specifications
        "mass_kg": 8,

        # Game stats
        "cost_musd": 10,
        "lead_time_months": 10,

        # Description
        "description_simple": "Reaches MEO and GEO at moderate speed.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": "Rate scales with (ref_distance / actual distance)^2, capped at max_data_rate.",
    },
    "COM-X-HGA": {
        # Identification
        "item_id": "COM-X-HGA",
        "item_name": "X-band High-gain Dish (1.5 m)",
        "band": "X",
        "real_analog": "High-gain X-band dish",
        "tier": "expert",

        # Antenna / RF
        "antenna_gain_dbi": 38,
        "tx_power_w": 50,
        "power_draw_w": 150,

        # Data link
        "data_rate_mbps_at_ref": 60,
        "ref_distance_km": 36000,
        "max_data_rate_mbps": 300,
        "max_range_km": 400000,

        # Operating requirements
        "pointing_required_deg": 0.3,
        "weather_dependent": False,

        # Physical specifications
        "mass_kg": 25,

        # Game stats
        "cost_musd": 25,
        "lead_time_months": 18,

        # Description
        "description_simple": "Strong long-range link; also useful beyond Earth orbit.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": "Rate scales with (ref_distance / actual distance)^2, capped at max_data_rate.",
    },
    "COM-KA-GEO": {
        # Identification
        "item_id": "COM-KA-GEO",
        "item_name": "Ka-band GEO Payload Link",
        "band": "Ka",
        "real_analog": "GEO satellite Ka-band link",
        "tier": "expert",

        # Antenna / RF
        "antenna_gain_dbi": 45,
        "tx_power_w": 100,
        "power_draw_w": 280,

        # Data link
        "data_rate_mbps_at_ref": 300,
        "ref_distance_km": 36000,
        "max_data_rate_mbps": 1500,
        "max_range_km": 100000,

        # Operating requirements
        "pointing_required_deg": 0.1,
        "weather_dependent": False,

        # Physical specifications
        "mass_kg": 40,

        # Game stats
        "cost_musd": 45,
        "lead_time_months": 24,

        # Description
        "description_simple": "Very high throughput from geostationary orbit.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": "Rate scales with (ref_distance / actual distance)^2, capped at max_data_rate.",
    },
}

avionics = {
    "OBC-BASIC": {
        # Identification
        "item_id": "OBC-BASIC",
        "item_name": "Basic Microcontroller OBC",
        "avionics_type": "OBC",
        "real_analog": "ARM Cortex-M class CubeSat computer",
        "tier": "basic",

        # Computer (OBC) specs
        "storage_gb": 4,
        "rad_tolerance_krad": 10,

        # Attitude control (ADCS) specs
        "pointing_accuracy_deg": None,

        # Power & mass
        "power_draw_w": 0.5,
        "mass_kg": 0.05,

        # Game stats
        "cost_musd": 0.05,
        "lead_time_months": 3,

        # Description
        "description_simple": "Simple and tiny; little memory and low radiation tolerance.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "OBC-CUBE": {
        # Identification
        "item_id": "OBC-CUBE",
        "item_name": "CubeSat Linux Computer",
        "avionics_type": "OBC",
        "real_analog": "ARM Cortex-A class CubeSat computer",
        "tier": "basic",

        # Computer (OBC) specs
        "storage_gb": 32,
        "rad_tolerance_krad": 20,

        # Attitude control (ADCS) specs
        "pointing_accuracy_deg": None,

        # Power & mass
        "power_draw_w": 1.5,
        "mass_kg": 0.1,

        # Game stats
        "cost_musd": 0.15,
        "lead_time_months": 3,

        # Description
        "description_simple": "More memory for image data.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "OBC-SPACE": {
        # Identification
        "item_id": "OBC-SPACE",
        "item_name": "Space-grade Processor Board",
        "avionics_type": "OBC",
        "real_analog": "Radiation-tolerant space-grade board",
        "tier": "advanced",

        # Computer (OBC) specs
        "storage_gb": 128,
        "rad_tolerance_krad": 50,

        # Attitude control (ADCS) specs
        "pointing_accuracy_deg": None,

        # Power & mass
        "power_draw_w": 8,
        "mass_kg": 1,

        # Game stats
        "cost_musd": 1.5,
        "lead_time_months": 9,

        # Description
        "description_simple": "Lots of storage and decent radiation tolerance.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "OBC-RADHARD": {
        # Identification
        "item_id": "OBC-RADHARD",
        "item_name": "Radiation-hardened Flight Computer",
        "avionics_type": "OBC",
        "real_analog": "RAD750-class flight computer",
        "tier": "expert",

        # Computer (OBC) specs
        "storage_gb": 64,
        "rad_tolerance_krad": 200,

        # Attitude control (ADCS) specs
        "pointing_accuracy_deg": None,

        # Power & mass
        "power_draw_w": 25,
        "mass_kg": 8,

        # Game stats
        "cost_musd": 12,
        "lead_time_months": 18,

        # Description
        "description_simple": "Survives harsh orbits for years, but heavy and power-hungry.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "ADCS-MAG": {
        # Identification
        "item_id": "ADCS-MAG",
        "item_name": "Magnetorquers + Sun Sensors",
        "avionics_type": "ADCS",
        "real_analog": "CubeSat magnetic attitude control",
        "tier": "basic",

        # Computer (OBC) specs
        "storage_gb": None,
        "rad_tolerance_krad": None,

        # Attitude control (ADCS) specs
        "pointing_accuracy_deg": 5,

        # Power & mass
        "power_draw_w": 0.8,
        "mass_kg": 0.2,

        # Game stats
        "cost_musd": 0.1,
        "lead_time_months": 3,

        # Description
        "description_simple": "Rough pointing using Earth's magnetic field.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "ADCS-WHEEL": {
        # Identification
        "item_id": "ADCS-WHEEL",
        "item_name": "3-axis Reaction Wheels",
        "avionics_type": "ADCS",
        "real_analog": "CubeSat reaction wheel unit",
        "tier": "basic",

        # Computer (OBC) specs
        "storage_gb": None,
        "rad_tolerance_krad": None,

        # Attitude control (ADCS) specs
        "pointing_accuracy_deg": 1,

        # Power & mass
        "power_draw_w": 2.5,
        "mass_kg": 1,

        # Game stats
        "cost_musd": 0.6,
        "lead_time_months": 4,

        # Description
        "description_simple": "Good pointing for cameras on small satellites.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "ADCS-STAR": {
        # Identification
        "item_id": "ADCS-STAR",
        "item_name": "Reaction Wheels + Star Tracker",
        "avionics_type": "ADCS",
        "real_analog": "SmallSat ADCS with star tracker",
        "tier": "advanced",

        # Computer (OBC) specs
        "storage_gb": None,
        "rad_tolerance_krad": None,

        # Attitude control (ADCS) specs
        "pointing_accuracy_deg": 0.05,

        # Power & mass
        "power_draw_w": 15,
        "mass_kg": 6,

        # Game stats
        "cost_musd": 4,
        "lead_time_months": 9,

        # Description
        "description_simple": "Accurate pointing for imagers and radar.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "ADCS-FINE": {
        # Identification
        "item_id": "ADCS-FINE",
        "item_name": "Fine-pointing System",
        "avionics_type": "ADCS",
        "real_analog": "Telescope-class fine pointing",
        "tier": "expert",

        # Computer (OBC) specs
        "storage_gb": None,
        "rad_tolerance_krad": None,

        # Attitude control (ADCS) specs
        "pointing_accuracy_deg": 0.001,

        # Power & mass
        "power_draw_w": 60,
        "mass_kg": 30,

        # Game stats
        "cost_musd": 25,
        "lead_time_months": 18,

        # Description
        "description_simple": "Needed by telescopes; heavy and expensive.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
}

instruments = {
    "INS-01": {
        # Identification
        "item_id": "INS-01",
        "item_name": "Compact RGB Camera",
        "science_category": "Earth observation",
        "real_analog": "CubeSat visible camera",
        "tier": "basic",

        # Physical specifications
        "mass_kg": 0.8,

        # Power & data
        "power_operating_w": 4,
        "duty_cycle_pct": 20,
        "data_generated_gb_per_day": 0.4,

        # Science
        "science_value_pts": 10,
        "pointing_required_deg": 1,

        # Compatibility
        "compatible_orbit_ids": [
            "ORB-LEO-400",
            "ORB-LEO-500",
            "ORB-SSO-600",
            "ORB-SSO-DD-600",
        ],

        # Game stats
        "cost_musd": 0.3,
        "lead_time_months": 6,

        # Description
        "description_simple": "Takes ordinary color pictures of Earth.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "INS-02": {
        # Identification
        "item_id": "INS-02",
        "item_name": "Multispectral Imager",
        "science_category": "Earth observation",
        "real_analog": "Landsat/Sentinel-2 class imager (scaled)",
        "tier": "advanced",

        # Physical specifications
        "mass_kg": 25,

        # Power & data
        "power_operating_w": 45,
        "duty_cycle_pct": 30,
        "data_generated_gb_per_day": 12,

        # Science
        "science_value_pts": 40,
        "pointing_required_deg": 0.1,

        # Compatibility
        "compatible_orbit_ids": [
            "ORB-LEO-500",
            "ORB-SSO-600",
            "ORB-SSO-DD-600",
            "ORB-POLAR-800",
            "ORB-GEO",
        ],

        # Game stats
        "cost_musd": 15,
        "lead_time_months": 24,

        # Description
        "description_simple": "Sees several colors of light to map land, water and crops.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "INS-03": {
        # Identification
        "item_id": "INS-03",
        "item_name": "Thermal Infrared Imager",
        "science_category": "Earth observation",
        "real_analog": "Wildfire / land-surface temperature imager",
        "tier": "advanced",

        # Physical specifications
        "mass_kg": 12,

        # Power & data
        "power_operating_w": 30,
        "duty_cycle_pct": 30,
        "data_generated_gb_per_day": 8,

        # Science
        "science_value_pts": 45,
        "pointing_required_deg": 0.1,

        # Compatibility
        "compatible_orbit_ids": [
            "ORB-LEO-500",
            "ORB-SSO-600",
            "ORB-SSO-DD-600",
            "ORB-POLAR-800",
            "ORB-GEO",
        ],

        # Game stats
        "cost_musd": 18,
        "lead_time_months": 24,

        # Description
        "description_simple": "Detects heat: fires, volcanoes, urban heat.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "INS-04": {
        # Identification
        "item_id": "INS-04",
        "item_name": "Hyperspectral Imager",
        "science_category": "Earth observation",
        "real_analog": "EMIT/PRISMA class imaging spectrometer",
        "tier": "expert",

        # Physical specifications
        "mass_kg": 60,

        # Power & data
        "power_operating_w": 120,
        "duty_cycle_pct": 25,
        "data_generated_gb_per_day": 40,

        # Science
        "science_value_pts": 70,
        "pointing_required_deg": 0.05,

        # Compatibility
        "compatible_orbit_ids": [
            "ORB-LEO-400",
            "ORB-LEO-500",
            "ORB-SSO-600",
            "ORB-SSO-DD-600",
        ],

        # Game stats
        "cost_musd": 45,
        "lead_time_months": 30,

        # Description
        "description_simple": "Hundreds of colors per pixel to identify materials and gases.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "INS-05": {
        # Identification
        "item_id": "INS-05",
        "item_name": "Small SAR (X-band radar)",
        "science_category": "Earth observation",
        "real_analog": "Small commercial SAR satellite class",
        "tier": "expert",

        # Physical specifications
        "mass_kg": 85,

        # Power & data
        "power_operating_w": 450,
        "duty_cycle_pct": 15,
        "data_generated_gb_per_day": 150,

        # Science
        "science_value_pts": 80,
        "pointing_required_deg": 0.2,

        # Compatibility
        "compatible_orbit_ids": [
            "ORB-LEO-400",
            "ORB-LEO-500",
            "ORB-SSO-600",
            "ORB-SSO-DD-600",
            "ORB-POLAR-800",
        ],

        # Game stats
        "cost_musd": 80,
        "lead_time_months": 36,

        # Description
        "description_simple": "Radar sees through clouds and at night; produces lots of data.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "INS-06": {
        # Identification
        "item_id": "INS-06",
        "item_name": "Atmospheric Gas Sounder",
        "science_category": "Atmosphere / climate",
        "real_analog": "OCO-2 class greenhouse gas spectrometer",
        "tier": "expert",

        # Physical specifications
        "mass_kg": 140,

        # Power & data
        "power_operating_w": 150,
        "duty_cycle_pct": 40,
        "data_generated_gb_per_day": 10,

        # Science
        "science_value_pts": 75,
        "pointing_required_deg": 0.1,

        # Compatibility
        "compatible_orbit_ids": [
            "ORB-SSO-600",
            "ORB-SSO-DD-600",
            "ORB-POLAR-800",
        ],

        # Game stats
        "cost_musd": 90,
        "lead_time_months": 42,

        # Description
        "description_simple": "Measures carbon dioxide in the atmosphere.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "INS-07": {
        # Identification
        "item_id": "INS-07",
        "item_name": "Fluxgate Magnetometer",
        "science_category": "Space physics",
        "real_analog": "Standard fluxgate magnetometer",
        "tier": "basic",

        # Physical specifications
        "mass_kg": 1.5,

        # Power & data
        "power_operating_w": 2,
        "duty_cycle_pct": 100,
        "data_generated_gb_per_day": 0.02,

        # Science
        "science_value_pts": 15,
        "pointing_required_deg": 10,

        # Compatibility
        "compatible_orbit_ids": [
            "ORB-LEO-400",
            "ORB-LEO-500",
            "ORB-SSO-600",
            "ORB-SSO-DD-600",
            "ORB-POLAR-800",
            "ORB-MEO-20200",
            "ORB-GTO",
            "ORB-GEO",
        ],

        # Game stats
        "cost_musd": 2,
        "lead_time_months": 12,

        # Description
        "description_simple": "Measures magnetic fields in space; tiny data.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "INS-08": {
        # Identification
        "item_id": "INS-08",
        "item_name": "Particle & Radiation Detector",
        "science_category": "Space physics",
        "real_analog": "Energetic particle detector",
        "tier": "basic",

        # Physical specifications
        "mass_kg": 3,

        # Power & data
        "power_operating_w": 5,
        "duty_cycle_pct": 100,
        "data_generated_gb_per_day": 0.05,

        # Science
        "science_value_pts": 20,
        "pointing_required_deg": 10,

        # Compatibility
        "compatible_orbit_ids": [
            "ORB-LEO-400",
            "ORB-LEO-500",
            "ORB-SSO-600",
            "ORB-SSO-DD-600",
            "ORB-POLAR-800",
            "ORB-MEO-20200",
            "ORB-GTO",
            "ORB-GEO",
        ],

        # Game stats
        "cost_musd": 4,
        "lead_time_months": 12,

        # Description
        "description_simple": "Counts charged particles to study space weather.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "INS-09": {
        # Identification
        "item_id": "INS-09",
        "item_name": "UV/Optical Space Telescope (0.3 m)",
        "science_category": "Astrophysics",
        "real_analog": "Small space telescope",
        "tier": "expert",

        # Physical specifications
        "mass_kg": 80,

        # Power & data
        "power_operating_w": 60,
        "duty_cycle_pct": 60,
        "data_generated_gb_per_day": 5,

        # Science
        "science_value_pts": 80,
        "pointing_required_deg": 0.001,

        # Compatibility
        "compatible_orbit_ids": [
            "ORB-SSO-600",
            "ORB-SSO-DD-600",
            "ORB-GTO",
            "ORB-GEO",
        ],

        # Game stats
        "cost_musd": 120,
        "lead_time_months": 48,

        # Description
        "description_simple": "Looks at stars and galaxies; needs extremely steady pointing.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
    "INS-10": {
        # Identification
        "item_id": "INS-10",
        "item_name": "Near-IR All-Sky Survey Spectrometer",
        "science_category": "Astrophysics",
        "real_analog": "SPHEREx-class sky survey instrument (scaled)",
        "tier": "expert",

        # Physical specifications
        "mass_kg": 110,

        # Power & data
        "power_operating_w": 90,
        "duty_cycle_pct": 80,
        "data_generated_gb_per_day": 20,

        # Science
        "science_value_pts": 85,
        "pointing_required_deg": 0.01,

        # Compatibility
        "compatible_orbit_ids": ["ORB-SSO-DD-600"],

        # Game stats
        "cost_musd": 100,
        "lead_time_months": 42,

        # Description
        "description_simple": "Maps the whole sky in many infrared colors; works best in a dawn-dusk orbit.",

        # Source
        "data_quality": "game_estimate (real-world class analog)",
        "notes": None,
    },
}

orbits = {
    "ORB-LEO-400": {
        # Identification
        "item_id": "ORB-LEO-400",
        "item_name": "LEO 400 km (ISS-like)",

        # Geometry
        "altitude_perigee_km": 400,
        "altitude_apogee_km": 400,
        "inclination_deg": 51.6,
        "period_min": 92.6,

        # Environment
        "eclipse_fraction": 0.37,
        "radiation_dose_krad_per_year": 1,
        "orbital_lifetime_years_no_reboost": 2,

        # Ground contact
        "ground_contact_min_per_day": 40,
        "ground_distance_km": 1500,

        # Launch requirements
        "lv_payload_ref": "LEO",
        "lv_payload_factor": 1,
        "required_onboard_dv_mps": 0,

        # Description
        "description_simple": "Low and easy to reach, but air drag brings satellites down in a couple of years.",

        # Source
        "data_quality": "period = computed from altitude; others game_estimate",
        "notes": None,
    },
    "ORB-LEO-500": {
        # Identification
        "item_id": "ORB-LEO-500",
        "item_name": "LEO 500 km",

        # Geometry
        "altitude_perigee_km": 500,
        "altitude_apogee_km": 500,
        "inclination_deg": 51.6,
        "period_min": 94.6,

        # Environment
        "eclipse_fraction": 0.37,
        "radiation_dose_krad_per_year": 1.5,
        "orbital_lifetime_years_no_reboost": 10,

        # Ground contact
        "ground_contact_min_per_day": 45,
        "ground_distance_km": 1500,

        # Launch requirements
        "lv_payload_ref": "LEO",
        "lv_payload_factor": 0.97,
        "required_onboard_dv_mps": 0,

        # Description
        "description_simple": "Longer life than 400 km, slightly harder to reach.",

        # Source
        "data_quality": "period = computed from altitude; others game_estimate",
        "notes": None,
    },
    "ORB-SSO-600": {
        # Identification
        "item_id": "ORB-SSO-600",
        "item_name": "Sun-synchronous 600 km (10:30)",

        # Geometry
        "altitude_perigee_km": 600,
        "altitude_apogee_km": 600,
        "inclination_deg": 97.8,
        "period_min": 96.7,

        # Environment
        "eclipse_fraction": 0.35,
        "radiation_dose_krad_per_year": 3,
        "orbital_lifetime_years_no_reboost": 25,

        # Ground contact
        "ground_contact_min_per_day": 55,
        "ground_distance_km": 1500,

        # Launch requirements
        "lv_payload_ref": "SSO",
        "lv_payload_factor": 1,
        "required_onboard_dv_mps": 0,

        # Description
        "description_simple": "Passes over each place at the same local time: great for consistent imaging.",

        # Source
        "data_quality": "period = computed from altitude; others game_estimate",
        "notes": None,
    },
    "ORB-SSO-DD-600": {
        # Identification
        "item_id": "ORB-SSO-DD-600",
        "item_name": "Dawn-dusk Sun-synchronous 600 km",

        # Geometry
        "altitude_perigee_km": 600,
        "altitude_apogee_km": 600,
        "inclination_deg": 97.8,
        "period_min": 96.7,

        # Environment
        "eclipse_fraction": 0.03,
        "radiation_dose_krad_per_year": 3,
        "orbital_lifetime_years_no_reboost": 25,

        # Ground contact
        "ground_contact_min_per_day": 55,
        "ground_distance_km": 1500,

        # Launch requirements
        "lv_payload_ref": "SSO",
        "lv_payload_factor": 0.97,
        "required_onboard_dv_mps": 0,

        # Description
        "description_simple": "Almost always in sunlight: lots of solar power and stable temperature.",

        # Source
        "data_quality": "period = computed from altitude; others game_estimate",
        "notes": None,
    },
    "ORB-POLAR-800": {
        # Identification
        "item_id": "ORB-POLAR-800",
        "item_name": "Polar LEO 800 km",

        # Geometry
        "altitude_perigee_km": 800,
        "altitude_apogee_km": 800,
        "inclination_deg": 90,
        "period_min": 100.9,

        # Environment
        "eclipse_fraction": 0.33,
        "radiation_dose_krad_per_year": 8,
        "orbital_lifetime_years_no_reboost": 100,

        # Ground contact
        "ground_contact_min_per_day": 65,
        "ground_distance_km": 1500,

        # Launch requirements
        "lv_payload_ref": "LEO",
        "lv_payload_factor": 0.85,
        "required_onboard_dv_mps": 0,

        # Description
        "description_simple": "Covers the whole globe, but more radiation and costly to reach.",

        # Source
        "data_quality": "period = computed from altitude; others game_estimate",
        "notes": None,
    },
    "ORB-MEO-20200": {
        # Identification
        "item_id": "ORB-MEO-20200",
        "item_name": "Medium Earth Orbit 20,200 km",

        # Geometry
        "altitude_perigee_km": 20200,
        "altitude_apogee_km": 20200,
        "inclination_deg": 55,
        "period_min": 718.7,

        # Environment
        "eclipse_fraction": 0.07,
        "radiation_dose_krad_per_year": 25,
        "orbital_lifetime_years_no_reboost": None,

        # Ground contact
        "ground_contact_min_per_day": 240,
        "ground_distance_km": 22000,

        # Launch requirements
        "lv_payload_ref": "GTO",
        "lv_payload_factor": 0.85,
        "required_onboard_dv_mps": 300,

        # Description
        "description_simple": "Navigation-satellite altitude: long contact windows, high radiation.",

        # Source
        "data_quality": "period = computed from altitude; others game_estimate",
        "notes": None,
    },
    "ORB-GTO": {
        # Identification
        "item_id": "ORB-GTO",
        "item_name": "Geostationary Transfer Orbit",

        # Geometry
        "altitude_perigee_km": 250,
        "altitude_apogee_km": 35786,
        "inclination_deg": 27,
        "period_min": 632,

        # Environment
        "eclipse_fraction": 0.05,
        "radiation_dose_krad_per_year": 15,
        "orbital_lifetime_years_no_reboost": None,

        # Ground contact
        "ground_contact_min_per_day": 360,
        "ground_distance_km": 36000,

        # Launch requirements
        "lv_payload_ref": "GTO",
        "lv_payload_factor": 1,
        "required_onboard_dv_mps": 0,

        # Description
        "description_simple": "A stretched orbit used as a stepping stone to GEO.",

        # Source
        "data_quality": "period = computed from altitude; others game_estimate",
        "notes": None,
    },
    "ORB-GEO": {
        # Identification
        "item_id": "ORB-GEO",
        "item_name": "Geostationary Orbit 35,786 km",

        # Geometry
        "altitude_perigee_km": 35786,
        "altitude_apogee_km": 35786,
        "inclination_deg": 0,
        "period_min": 1436,

        # Environment
        "eclipse_fraction": 0.01,
        "radiation_dose_krad_per_year": 8,
        "orbital_lifetime_years_no_reboost": None,

        # Ground contact
        "ground_contact_min_per_day": 1440,
        "ground_distance_km": 36000,

        # Launch requirements
        "lv_payload_ref": "GTO",
        "lv_payload_factor": 1,
        "required_onboard_dv_mps": 1500,

        # Description
        "description_simple": "Hovers over one spot: constant contact, but you must burn from GTO to get there.",

        # Source
        "data_quality": "period = computed from altitude; others game_estimate",
        "notes": "~1.5 km/s GTO->GEO is a typical order of magnitude.",
    },
}

scenarios = {
    "SC-01": {
        # Identification
        "item_id": "SC-01",
        "item_name": "First Eyes on Earth",
        "difficulty": "Easy",

        # Description
        "description_simple": "Build a CubeSat that takes pictures of Earth.",
        "learning_goal": "Mass, power and data basics.",

        # Constraints
        "allowed_orbit_ids": [
            "ORB-LEO-400",
            "ORB-LEO-500",
        ],
        "budget_musd": 12,
        "min_science_pts": 10,
        "min_mission_life_years": 1,
        "deadline_months": 18,

        # Source
        "data_quality": "game_estimate",
        "notes": "Demo sheet uses ONE instrument; in the real game sum science points of all instruments.",
    },
    "SC-02": {
        # Identification
        "item_id": "SC-02",
        "item_name": "Coastal Watch",
        "difficulty": "Normal",

        # Description
        "description_simple": "Monitor coastlines and farmland with a multispectral imager.",
        "learning_goal": "Why Sun-synchronous orbits are useful; power vs eclipse.",

        # Constraints
        "allowed_orbit_ids": [
            "ORB-SSO-600",
            "ORB-SSO-DD-600",
            "ORB-LEO-500",
        ],
        "budget_musd": 70,
        "min_science_pts": 40,
        "min_mission_life_years": 3,
        "deadline_months": 36,

        # Source
        "data_quality": "game_estimate",
        "notes": "Demo sheet uses ONE instrument; in the real game sum science points of all instruments.",
    },
    "SC-03": {
        # Identification
        "item_id": "SC-03",
        "item_name": "Space Weather Sentinel",
        "difficulty": "Normal",

        # Description
        "description_simple": "Measure particles in medium Earth orbit.",
        "learning_goal": "Radiation hardening and delta-v.",

        # Constraints
        "allowed_orbit_ids": [
            "ORB-MEO-20200",
            "ORB-GTO",
        ],
        "budget_musd": 180,
        "min_science_pts": 20,
        "min_mission_life_years": 5,
        "deadline_months": 48,

        # Source
        "data_quality": "game_estimate",
        "notes": "Demo sheet uses ONE instrument; in the real game sum science points of all instruments.",
    },
    "SC-04": {
        # Identification
        "item_id": "SC-04",
        "item_name": "Greenhouse Gas Monitor",
        "difficulty": "Hard",

        # Description
        "description_simple": "Measure CO2 from a Sun-synchronous orbit.",
        "learning_goal": "Matching bus, power and data downlink to a big instrument.",

        # Constraints
        "allowed_orbit_ids": [
            "ORB-SSO-600",
            "ORB-SSO-DD-600",
        ],
        "budget_musd": 300,
        "min_science_pts": 70,
        "min_mission_life_years": 5,
        "deadline_months": 60,

        # Source
        "data_quality": "game_estimate",
        "notes": "Demo sheet uses ONE instrument; in the real game sum science points of all instruments.",
    },
    "SC-05": {
        # Identification
        "item_id": "SC-05",
        "item_name": "All-Weather Radar Eye",
        "difficulty": "Hard",

        # Description
        "description_simple": "Image Earth through clouds with radar.",
        "learning_goal": "Huge data volumes need fast downlink.",

        # Constraints
        "allowed_orbit_ids": [
            "ORB-POLAR-800",
            "ORB-SSO-600",
            "ORB-LEO-500",
        ],
        "budget_musd": 250,
        "min_science_pts": 80,
        "min_mission_life_years": 5,
        "deadline_months": 60,

        # Source
        "data_quality": "game_estimate",
        "notes": "Demo sheet uses ONE instrument; in the real game sum science points of all instruments.",
    },
    "SC-06": {
        # Identification
        "item_id": "SC-06",
        "item_name": "Deep Sky Telescope",
        "difficulty": "Expert",

        # Description
        "description_simple": "Observe the sky from a steady, sunlit orbit.",
        "learning_goal": "Fine pointing and thermal/power stability.",

        # Constraints
        "allowed_orbit_ids": [
            "ORB-SSO-DD-600",
            "ORB-SSO-600",
        ],
        "budget_musd": 400,
        "min_science_pts": 80,
        "min_mission_life_years": 7,
        "deadline_months": 72,

        # Source
        "data_quality": "game_estimate",
        "notes": "Demo sheet uses ONE instrument; in the real game sum science points of all instruments.",
    },
    "SC-07": {
        # Identification
        "item_id": "SC-07",
        "item_name": "Geostationary Weather Eye",
        "difficulty": "Hard",

        # Description
        "description_simple": "Watch the same weather from geostationary orbit for 10 years.",
        "learning_goal": "Delta-v to reach GEO and long-life radiation.",

        # Constraints
        "allowed_orbit_ids": ["ORB-GEO"],
        "budget_musd": 700,
        "min_science_pts": 40,
        "min_mission_life_years": 10,
        "deadline_months": 72,

        # Source
        "data_quality": "game_estimate",
        "notes": "Demo sheet uses ONE instrument; in the real game sum science points of all instruments.",
    },
    "SC-08": {
        # Identification
        "item_id": "SC-08",
        "item_name": "Sandbox",
        "difficulty": "Sandbox",

        # Description
        "description_simple": "No constraints: experiment freely.",
        "learning_goal": "Free exploration.",

        # Constraints
        "allowed_orbit_ids": [
            "ORB-LEO-400",
            "ORB-LEO-500",
            "ORB-SSO-600",
            "ORB-SSO-DD-600",
            "ORB-POLAR-800",
            "ORB-MEO-20200",
            "ORB-GTO",
            "ORB-GEO",
        ],
        "budget_musd": 100000,
        "min_science_pts": 0,
        "min_mission_life_years": 0,
        "deadline_months": 999,

        # Source
        "data_quality": "game_estimate",
        "notes": "Demo sheet uses ONE instrument; in the real game sum science points of all instruments.",
    },
}
