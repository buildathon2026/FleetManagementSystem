#!/usr/bin/env python3
"""
Synthetic document generator for Fleet Management System
Generates realistic but fabricated documents for ingestion pipeline testing
"""

import os
import json
import random
from datetime import datetime, timedelta
from pathlib import Path

# Fleet data
TRUCK_UNITS = [84, 91, 105, 112, 118, 125, 132, 140, 151, 168]
TRUCK_IDS = [f"T-{u:03d}" for u in TRUCK_UNITS]
VINS = [
    "3AKJHHDR7BS467821", "5TDJVRV33LS467892", "2FZJD5D92CHA27814",
    "1FUJITSU82D1SJSYT", "8LGETD65X62034915", "3ALACM7S83E823957",
    "2FZJKAC86CCA34928", "5P5GF0834LV023945", "3ALACM5S35E784296",
    "5TDJCRV33LS293847"
]
MAKES = ["Freightliner", "Peterbilt", "Volvo", "Isuzu", "Kenworth", "Mack"]
DRIVERS = ["John Smith", "Maria Garcia", "Robert Johnson", "David Chen", "James Wilson",
           "Michael Torres", "Antoine Beaumont", "Philip Morrison", "Kevin Hayes", "Samuel Price"]
FUEL_STATIONS = ["Pilot Travel Center #412", "Love's Travel Stop #287", "TA/Petro #156",
                  "Speedway #501", "BP Truck Stop", "Shell Travel Center"]
CITIES = ["Dallas TX", "Houston TX", "Los Angeles CA", "Atlanta GA", "Chicago IL",
          "Denver CO", "Phoenix AZ", "Miami FL", "Seattle WA", "Nashville TN"]
VENDORS = ["ABC Auto Parts", "Penske Truck Rental", "Cross Truck Services", "Truck Care Inc",
           "Diesel King", "Elite Maintenance", "Premier Fleet Services", "Quality Truck Repair"]
MAINTENANCE_TYPES = ["oil change", "tire replacement", "brake service", "coolant flush",
                     "transmission service", "air filter replacement", "inspection", "safety check"]

def generate_insurance_docs(output_dir):
    """Generate 10 insurance certificate documents"""
    os.makedirs(output_dir, exist_ok=True)

    for i, truck_id in enumerate(TRUCK_IDS[:10], 1):
        unit_num = TRUCK_UNITS[i-1]
        doc = f"""COMMERCIAL VEHICLE INSURANCE CERTIFICATE

Certificate Number: FL-ABC-{i:04d}
Insurance Company: Progressive Commercial
Policy Number: POL-{i:06d}
Issue Date: {(datetime.now() - timedelta(days=180)).strftime('%B %d, %Y')}
Effective Date: {(datetime.now() - timedelta(days=180)).strftime('%B %d, %Y')}
Expiration Date: {(datetime.now() + timedelta(days=185)).strftime('%B %d, %Y')}

INSURED INFORMATION
Name: ABC Trucking LLC
Address: 1547 Commerce Drive, Dallas, TX 75207
Fleet ID: FL-084

VEHICLE INFORMATION
Unit Number: {unit_num}
Fleet Designation: Unit {unit_num}
Make/Model: {random.choice(MAKES)} Truck
VIN: {VINS[i-1]}
Gross Vehicle Weight Rating: 80,000 lbs

COVERAGE INFORMATION
Liability Limit: $1,000,000 each occurrence
Property Damage: $500,000 each occurrence
Bodily Injury: $500,000 each occurrence
Medical Payments: $25,000
Uninsured Motorist: $1,000,000
Cargo Coverage: $100,000

Additional Insured: ABC Trucking Brokers LLC

Certificate Holder: ABC Trucking LLC
Authorized Representative: Sarah Mitchell
Phone: (214) 555-0123

This certificate is issued as a matter of information only and confers no rights upon the certificate holder.

Signature: _________________
Date: {datetime.now().strftime('%B %d, %Y')}
"""
        with open(os.path.join(output_dir, f"INS_{i:03d}_{truck_id}.txt"), "w") as f:
            f.write(doc)

def generate_tax_forms(output_dir):
    """Generate 10 Form 2290 (Heavy Highway Vehicle Use Tax) documents"""
    os.makedirs(output_dir, exist_ok=True)

    for i, vin in enumerate(VINS[:10], 1):
        truck_id = TRUCK_IDS[i-1]
        doc = f"""IRS FORM 2290 - HEAVY HIGHWAY VEHICLE USE TAX RETURN

Tax Year: 2026
Form 2290 Filing ID: 2290-{i:06d}
Date Prepared: {(datetime.now() - timedelta(days=60)).strftime('%m/%d/%Y')}

VEHICLE OWNER INFORMATION
Name: ABC Trucking LLC
EIN: 75-2847392
Address: 1547 Commerce Drive, Dallas, TX 75207
Phone: (214) 555-0123

VEHICLE INFORMATION
Vehicle Identification Number (VIN): {vin}
Make: {random.choice(MAKES)}
Gross Vehicle Weight: 80,000 lbs
First Used: {(datetime.now() - timedelta(days=365*2)).strftime('%m/%d/%Y')}

TAX CALCULATION
Base Tax: $550.00
Monthly Tax Rate (if not full year): $46.00 per month
Months of Use (2026): 12
Total Tax Due: $550.00

EXEMPTIONS
Agricultural Vehicle: No
Harvester Vehicle: No
School Bus: No
Government Vehicle: No

Paid By: Check (Check Number: {random.randint(5000, 9999)})
Amount Paid: $550.00
Date Paid: {(datetime.now() - timedelta(days=45)).strftime('%m/%d/%Y')}
Acceptance Number: {random.randint(100000, 999999)}

Preparer Name: John Davis, CPA
Preparer Phone: (214) 555-0142
Signature: _________________
"""
        with open(os.path.join(output_dir, f"TAX_{i:03d}_{truck_id}.txt"), "w") as f:
            f.write(doc)

def generate_fuel_receipts(output_dir, count=60):
    """Generate fuel receipts"""
    os.makedirs(output_dir, exist_ok=True)

    for i in range(1, count + 1):
        truck_unit = random.choice(TRUCK_UNITS)
        truck_formats = [f"Trk {truck_unit}", f"Unit{truck_unit}", f"Unit {truck_unit}", str(truck_unit)]

        doc = f"""FUEL RECEIPT

Station: {random.choice(FUEL_STATIONS)}, {random.choice(CITIES)}
Receipt Number: FUEL-{i:06d}
Date: {(datetime.now() - timedelta(days=random.randint(1, 30))).strftime('%m/%d/%Y')}
Time: {random.randint(6, 22):02d}:{random.randint(0, 59):02d}

VEHICLE INFORMATION
Truck: {random.choice(truck_formats)}
Driver: {random.choice(DRIVERS)}
Odometer: {random.randint(100000, 400000)}

FUEL DETAILS
Fuel Grade: Diesel #2
Gallons: {round(random.uniform(80, 150), 1)}
Price per Gallon: ${random.uniform(3.50, 4.20):.2f}
Subtotal: ${round(random.uniform(300, 700), 2)}
Tax: ${round(random.uniform(20, 50), 2)}
Total Amount: ${round(random.uniform(330, 750), 2)}

Payment Method: Fleet Card
Card Last 4: {random.randint(1000, 9999)}
Pump Number: {random.randint(1, 20)}

Thank you for your business!
"""
        with open(os.path.join(output_dir, f"FUEL_{i:04d}.txt"), "w") as f:
            f.write(doc)

def generate_maintenance_invoices(output_dir, count=40):
    """Generate maintenance invoices"""
    os.makedirs(output_dir, exist_ok=True)

    for i in range(1, count + 1):
        truck_unit = random.choice(TRUCK_UNITS)
        truck_id = f"T-{truck_unit:03d}"
        invoice_date = datetime.now() - timedelta(days=random.randint(1, 60))

        doc = f"""MAINTENANCE INVOICE

Invoice Number: INV-{i:04d}
Date: {invoice_date.strftime('%B %d, %Y')}
Invoice ID: MNT-{i:06d}

CUSTOMER INFORMATION
Company: ABC Trucking LLC
Address: 1547 Commerce Drive, Dallas, TX 75207
Contact: Dispatch Team
Phone: (214) 555-0123

VEHICLE INFORMATION
Unit/Fleet ID: Unit {truck_unit} ({truck_id})
Make/Model: {random.choice(MAKES)} Truck
Odometer Reading: {random.randint(100000, 400000)} miles

SERVICE PROVIDER
Shop Name: {random.choice(VENDORS)}
Address: {random.choice(CITIES)}
Contact: (214) 555-9876

SERVICES RENDERED
Description: {random.choice(MAINTENANCE_TYPES).title()}
Hours: {round(random.uniform(0.5, 8), 1)}
Rate: ${random.randint(75, 150)}/hour
Parts Cost: ${round(random.uniform(50, 1000), 2)}
Labor Cost: ${round(random.uniform(100, 800), 2)}
Subtotal: ${round(random.uniform(150, 1500), 2)}
Tax (8.25%): ${round(random.uniform(12, 125), 2)}

TOTAL DUE: ${round(random.uniform(170, 1625), 2)}

Terms: Net 30
Due Date: {(invoice_date + timedelta(days=30)).strftime('%B %d, %Y')}

Authorized By: {random.choice(DRIVERS)}
Shop Signature: _________________
"""
        with open(os.path.join(output_dir, f"MAINT_{i:04d}.txt"), "w") as f:
            f.write(doc)

def generate_inspections(output_dir, count=10):
    """Generate DOT annual inspection documents"""
    os.makedirs(output_dir, exist_ok=True)

    for i, truck_id in enumerate(TRUCK_IDS[:count], 1):
        unit_num = TRUCK_UNITS[i-1]
        doc = f"""ANNUAL DOT INSPECTION REPORT

Inspection Number: DOT-{i:06d}
Inspection Date: {(datetime.now() - timedelta(days=random.randint(1, 180))).strftime('%B %d, %Y')}
Valid Until: {(datetime.now() + timedelta(days=random.randint(180, 365))).strftime('%B %d, %Y')}
Inspection Station: ABC Certified Inspection Service
Inspector License: INSP-{random.randint(10000, 99999)}

VEHICLE INFORMATION
Unit Number: {unit_num} ({truck_id})
Make/Model: {random.choice(MAKES)} Truck
Year: {random.randint(2021, 2024)}
VIN: {VINS[i-1]}
Gross Vehicle Weight: 80,000 lbs
Odometer: {random.randint(100000, 400000)} miles

INSPECTION RESULTS - PASS ✓

EXTERIOR
[ ✓ ] Lights and Reflectors: PASS
[ ✓ ] Windshield/Wipers: PASS
[ ✓ ] Mirrors: PASS
[ ✓ ] Body/Doors: PASS
[ ✓ ] Coupling Device: PASS

MECHANICAL
[ ✓ ] Brakes: PASS
[ ✓ ] Tires: PASS
[ ✓ ] Suspension: PASS
[ ✓ ] Steering: PASS
[ ✓ ] Engine: PASS
[ ✓ ] Transmission: PASS

SAFETY EQUIPMENT
[ ✓ ] Fire Extinguisher: PASS
[ ✓ ] Emergency Equipment: PASS
[ ✓ ] Safety Belt: PASS
[ ✓ ] Placards/Markings: PASS

OVERALL RESULT: APPROVED FOR SERVICE

Inspector Name: Michael Torres
Signature: _________________
Print Name: Michael Torres
Inspector Certification: INSP-2847392
"""
        with open(os.path.join(output_dir, f"INSP_{i:03d}_{truck_id}.txt"), "w") as f:
            f.write(doc)

def generate_settlement_statements(output_dir, count=30):
    """Generate settlement statements"""
    os.makedirs(output_dir, exist_ok=True)

    for i in range(1, count + 1):
        truck_unit = random.choice(TRUCK_UNITS)
        truck_id = f"T-{truck_unit:03d}"
        driver_name = random.choice(DRIVERS)
        settlement_date = datetime.now() - timedelta(days=random.randint(1, 45))

        doc = f"""SETTLEMENT STATEMENT

Settlement ID: STL-{i:06d}
Date: {settlement_date.strftime('%B %d, %Y')}
Period: {(settlement_date - timedelta(days=14)).strftime('%B %d, %Y')} to {settlement_date.strftime('%B %d, %Y')}

LOAD INFORMATION
Load #: LOAD-{random.randint(10000, 99999)}
Shipper: Various Clients
Consignee: Various Locations
Truck/Unit: Unit {truck_unit} ({truck_id})
Driver: {driver_name}
Miles: {random.randint(500, 2000)}

REVENUE
Freight Charges: ${round(random.uniform(800, 2500), 2)}
Fuel Surcharge: ${round(random.uniform(80, 400), 2)}
Accessorial Charges: ${round(random.uniform(0, 300), 2)}
Total Revenue: ${round(random.uniform(900, 3000), 2)}

DEDUCTIONS
Fuel Cost: ${round(random.uniform(300, 800), 2)}
Maintenance: ${round(random.uniform(50, 400), 2)}
Insurance: ${round(random.uniform(50, 200), 2)}
Tolls: ${round(random.uniform(20, 150), 2)}
Commission: ${round(random.uniform(100, 400), 2)}
Miscellaneous: ${round(random.uniform(0, 100), 2)}
Total Deductions: ${round(random.uniform(500, 1500), 2)}

NET SETTLEMENT: ${round(random.uniform(400, 1500), 2)}

Broker: ABC Freight Logistics
Payment Method: ACH Transfer
Reference: {driver_name.replace(' ', '_').upper()}-{i:04d}
"""
        with open(os.path.join(output_dir, f"SETTLE_{i:04d}.txt"), "w") as f:
            f.write(doc)

def generate_emails(output_dir, count=20):
    """Generate email documents"""
    os.makedirs(output_dir, exist_ok=True)

    email_templates = [
        "White Cascadia needs brake service",
        "Unit 84 maintenance reminder",
        "Vehicle inspection due",
        "Insurance renewal notice",
        "Fuel card update",
        "Fleet registration expiration",
        "Driver safety training",
        "Truck repair quote",
        "Accident report attached",
        "Route optimization update",
    ]

    for i in range(1, count + 1):
        email_date = datetime.now() - timedelta(days=random.randint(1, 60))
        from_addr = random.choice(["dispatch@abctrucking.com", "admin@abctrucking.com", "maintenance@abctrucking.com"])
        to_addr = "ops@abctrucking.com"
        subject = random.choice(email_templates)

        doc = f"""From: {from_addr}
To: {to_addr}
Date: {email_date.strftime('%a, %b %d, %Y at %H:%M %p')}
Subject: {subject}

Hi Operations Team,

{subject.lower()} - Please review and take action.

Unit {random.choice(TRUCK_UNITS)} status update needed.

Driver: {random.choice(DRIVERS)}

Action required by: {(email_date + timedelta(days=random.randint(1, 7))).strftime('%B %d, %Y')}

Please confirm receipt.

Thanks,
Fleet Management System
"""
        with open(os.path.join(output_dir, f"EMAIL_{i:03d}.txt"), "w") as f:
            f.write(doc)

def generate_toll_receipts(output_dir, count=30):
    """Generate toll receipts"""
    os.makedirs(output_dir, exist_ok=True)

    toll_roads = [
        "Harris County Toll Road Authority",
        "TX-DOT Toll Collection",
        "Dallas North Tollway",
        "Sam Rayburn Tollway",
        "Intercontinental Toll Plaza"
    ]

    for i in range(1, count + 1):
        truck_unit = random.choice(TRUCK_UNITS)
        receipt_date = datetime.now() - timedelta(days=random.randint(1, 45))

        doc = f"""TOLL RECEIPT

Receipt Number: TOLL-{i:06d}
Date: {receipt_date.strftime('%m/%d/%Y')}
Time: {random.randint(6, 22):02d}:{random.randint(0, 59):02d}

TOLL AUTHORITY: {random.choice(toll_roads)}
TRANSPONDER ACCOUNT: {random.randint(100000, 999999)}

VEHICLE INFORMATION
Fleet Unit ID: Unit {truck_unit}
Transponder ID: TX-{random.randint(1000, 9999)}

TOLL CHARGES
Toll Plaza: {random.choice(['North', 'South', 'East', 'West'])} Plaza
Class: Commercial Truck (2 Axles)
Charge: ${round(random.uniform(2.50, 8.50), 2)}

ACCOUNT INFORMATION
Current Balance: ${round(random.uniform(50, 500), 2)}
Transaction Type: Toll Collection
Status: Completed

Note: Toll paid electronically via transponder account

Questions? Contact: {random.randint(800, 999)}-TOLL-TX
Website: www.tolltexas.gov
"""
        with open(os.path.join(output_dir, f"TOLL_{i:04d}.txt"), "w") as f:
            f.write(doc)

def main():
    """Generate all synthetic documents"""
    base_dir = Path(__file__).parent

    print("Generating synthetic documents...")

    generate_insurance_docs(str(base_dir / "insurance"))
    print("✓ Generated 10 insurance certificates")

    generate_tax_forms(str(base_dir / "tax_forms"))
    print("✓ Generated 10 tax forms")

    generate_fuel_receipts(str(base_dir / "fuel_receipts"))
    print("✓ Generated 60 fuel receipts")

    generate_maintenance_invoices(str(base_dir / "maintenance"))
    print("✓ Generated 40 maintenance invoices")

    generate_inspections(str(base_dir / "inspections"))
    print("✓ Generated 10 DOT inspection reports")

    generate_settlement_statements(str(base_dir / "settlements"))
    print("✓ Generated 30 settlement statements")

    generate_emails(str(base_dir / "emails"))
    print("✓ Generated 20 emails")

    generate_toll_receipts(str(base_dir / "toll_receipts"))
    print("✓ Generated 30 toll receipts")

    print("\n✅ All synthetic documents generated successfully!")
    print("Total documents: ~220")

if __name__ == "__main__":
    main()
