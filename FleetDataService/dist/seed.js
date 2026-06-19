"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const db_1 = require("./db");
// Fleet composition
const trucks = [
    'T-084', 'T-085', 'T-086', 'T-087', 'T-088',
    'T-089', 'T-090', 'T-091', 'T-092', 'T-093'
];
const drivers = [
    { id: 'DRV-001', name: 'John Smith' },
    { id: 'DRV-002', name: 'Maria Garcia' },
    { id: 'DRV-003', name: 'James Wilson' },
    { id: 'DRV-004', name: 'Robert Johnson' },
    { id: 'DRV-005', name: 'Linda Davis' },
    { id: 'DRV-006', name: 'David Martinez' },
    { id: 'DRV-007', name: 'Sarah Brown' },
    { id: 'DRV-008', name: 'Michael Lee' },
    { id: 'DRV-009', name: 'Jennifer Taylor' },
    { id: 'DRV-010', name: 'William Anderson' },
];
const trailers = [
    'TR-22', 'TR-15', 'TR-33', 'TR-08', 'TR-41',
    'TR-19', 'TR-27', 'TR-36', 'TR-44', 'TR-11'
];
const truckDetails = {
    'T-084': { year: 2019, make: 'Freightliner', model: 'Cascadia', vin: '3AKJHHDR7KSJF4821' },
    'T-085': { year: 2020, make: 'Kenworth', model: 'T680', vin: '1XKYD49X4LJ456789' },
    'T-086': { year: 2021, make: 'Peterbilt', model: '579', vin: '1XPWD40X1MD789012' },
    'T-087': { year: 2018, make: 'Volvo', model: 'VNL 860', vin: '4V4NC9EH5JN234567' },
    'T-088': { year: 2022, make: 'International', model: 'LT', vin: '3HSDJAPR4NN345678' },
    'T-089': { year: 2020, make: 'Mack', model: 'Anthem', vin: '1M1AN07Y5LM456123' },
    'T-090': { year: 2019, make: 'Freightliner', model: 'Cascadia', vin: '3AKJHHDR9KSJF5932' },
    'T-091': { year: 2021, make: 'Kenworth', model: 'W990', vin: '1XKWD40X3MJ567890' },
    'T-092': { year: 2022, make: 'Peterbilt', model: '389', vin: '1XPWD49X7ND890123' },
    'T-093': { year: 2020, make: 'Volvo', model: 'VNL 760', vin: '4V4NC9EH7LN678901' },
};
const expenseCategories = ['fuel', 'parts', 'labor', 'insurance', 'registration', 'tax', 'toll'];
const docTypes = [
    'title', 'registration', 'insurance', 'tax_form',
    'fuel_receipt', 'maintenance', 'inspection', 'settlement', 'email', 'toll_receipt'
];
function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomFloat(min, max, decimals = 2) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}
function randomDate(startMonth, endMonth, year = 2026) {
    const month = randomBetween(startMonth, endMonth);
    const day = randomBetween(1, 28);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function generateLoadId() {
    const prefix = ['LD', 'FRT', 'SHP'][randomBetween(0, 2)];
    return `${prefix}-${randomBetween(10000, 99999)}`;
}
function seedDatabase() {
    const db = (0, db_1.getDb)();
    // Clear existing data
    db.exec(`
    DELETE FROM audit_log;
    DELETE FROM documents;
    DELETE FROM revenue;
    DELETE FROM expenses;
    DELETE FROM aliases;
    DELETE FROM entities;
  `);
    // Insert truck entities and aliases
    const insertEntity = db.prepare('INSERT INTO entities (id, type, canonical_name) VALUES (?, ?, ?)');
    const insertAlias = db.prepare('INSERT INTO aliases (entity_id, alias_text, confidence) VALUES (?, ?, ?)');
    for (let i = 0; i < trucks.length; i++) {
        const truckId = trucks[i];
        const detail = truckDetails[truckId];
        const num = truckId.replace('T-', '');
        insertEntity.run(truckId, 'truck', `${detail.year} ${detail.make} ${detail.model} (${truckId})`);
        // Aliases for each truck
        insertAlias.run(truckId, `Unit ${parseInt(num)}`, 1.0);
        insertAlias.run(truckId, `Truck #${num}`, 1.0);
        insertAlias.run(truckId, `FL-${num}`, 1.0);
        insertAlias.run(truckId, `VIN ${detail.vin}`, 1.0);
        insertAlias.run(truckId, `${detail.year} ${detail.make} ${detail.model}`, 0.9);
        insertAlias.run(truckId, truckId, 1.0);
        insertAlias.run(truckId, `truck ${parseInt(num)}`, 0.9);
    }
    // Insert driver entities and aliases
    for (const driver of drivers) {
        insertEntity.run(driver.id, 'driver', driver.name);
        insertAlias.run(driver.id, driver.name, 1.0);
        insertAlias.run(driver.id, driver.name.split(' ')[0], 0.7);
        insertAlias.run(driver.id, driver.name.split(' ')[1], 0.5);
        insertAlias.run(driver.id, driver.id, 1.0);
    }
    // Insert trailer entities and aliases
    for (const trailer of trailers) {
        const num = trailer.replace('TR-', '');
        insertEntity.run(trailer, 'trailer', `Trailer ${trailer}`);
        insertAlias.run(trailer, trailer, 1.0);
        insertAlias.run(trailer, `Trailer ${parseInt(num)}`, 0.9);
        insertAlias.run(trailer, `trailer #${num}`, 0.9);
    }
    // Generate expenses (3-6 months: Jan 2026 - June 2026)
    const insertExpense = db.prepare('INSERT INTO expenses (truck_id, date, amount, category, description, doc_ref) VALUES (?, ?, ?, ?, ?, ?)');
    const fuelDescriptions = ['Diesel fill-up', 'Fuel stop I-95', 'Truck stop fuel', 'Pilot fuel stop', 'TA fuel center'];
    const partsDescriptions = ['Brake pads replacement', 'Air filter', 'Oil filter set', 'Tire rotation', 'Belt replacement', 'Headlight bulbs'];
    const laborDescriptions = ['Scheduled maintenance', 'Brake inspection', 'Engine tune-up', 'Transmission service', 'A/C repair'];
    const tollDescriptions = ['NJ Turnpike', 'PA Turnpike', 'OH Turnpike', 'NY Thruway', 'I-90 toll', 'George Washington Bridge'];
    for (const truckId of trucks) {
        // Fuel: 2-4 per week over 6 months ≈ 50-100 records
        const fuelCount = randomBetween(50, 80);
        for (let j = 0; j < fuelCount; j++) {
            insertExpense.run(truckId, randomDate(1, 6), randomFloat(250, 650), 'fuel', fuelDescriptions[randomBetween(0, fuelDescriptions.length - 1)], `DOC-FUEL-${truckId}-${j}`);
        }
        // Parts: 3-8 over 6 months
        const partsCount = randomBetween(3, 8);
        for (let j = 0; j < partsCount; j++) {
            insertExpense.run(truckId, randomDate(1, 6), randomFloat(50, 2500), 'parts', partsDescriptions[randomBetween(0, partsDescriptions.length - 1)], `DOC-PARTS-${truckId}-${j}`);
        }
        // Labor: 2-5 over 6 months
        const laborCount = randomBetween(2, 5);
        for (let j = 0; j < laborCount; j++) {
            insertExpense.run(truckId, randomDate(1, 6), randomFloat(200, 1800), 'labor', laborDescriptions[randomBetween(0, laborDescriptions.length - 1)], `DOC-LABOR-${truckId}-${j}`);
        }
        // Insurance: 1 per quarter
        for (let q = 1; q <= 2; q++) {
            const month = q === 1 ? randomBetween(1, 3) : randomBetween(4, 6);
            insertExpense.run(truckId, randomDate(month, month), randomFloat(800, 1500), 'insurance', 'Quarterly insurance premium', `DOC-INS-${truckId}-Q${q}`);
        }
        // Registration: 1 per year
        insertExpense.run(truckId, randomDate(1, 3), randomFloat(1200, 2200), 'registration', 'Annual registration renewal', `DOC-REG-${truckId}-2026`);
        // Tax: 1-2 per 6 months
        insertExpense.run(truckId, randomDate(1, 4), randomFloat(500, 3000), 'tax', 'HVUT / Road use tax', `DOC-TAX-${truckId}-2026`);
        // Tolls: 10-20 over 6 months
        const tollCount = randomBetween(10, 20);
        for (let j = 0; j < tollCount; j++) {
            insertExpense.run(truckId, randomDate(1, 6), randomFloat(5, 45), 'toll', tollDescriptions[randomBetween(0, tollDescriptions.length - 1)], `DOC-TOLL-${truckId}-${j}`);
        }
    }
    // Generate revenue records
    const insertRevenue = db.prepare('INSERT INTO revenue (truck_id, date, amount, load_id, description) VALUES (?, ?, ?, ?, ?)');
    const routes = [
        'Chicago IL → Detroit MI', 'Atlanta GA → Miami FL', 'Dallas TX → Houston TX',
        'Los Angeles CA → Phoenix AZ', 'Denver CO → Kansas City MO', 'Nashville TN → Memphis TN',
        'Philadelphia PA → New York NY', 'Columbus OH → Indianapolis IN', 'Charlotte NC → Raleigh NC',
        'Seattle WA → Portland OR', 'Jacksonville FL → Savannah GA', 'San Antonio TX → Austin TX'
    ];
    for (const truckId of trucks) {
        // 15-30 loads over 6 months
        const loadCount = randomBetween(15, 30);
        for (let j = 0; j < loadCount; j++) {
            insertRevenue.run(truckId, randomDate(1, 6), randomFloat(1500, 8500), generateLoadId(), routes[randomBetween(0, routes.length - 1)]);
        }
    }
    // Generate documents
    const insertDoc = db.prepare('INSERT INTO documents (id, entity_id, doc_type, date, summary, content, active) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const truckId of trucks) {
        const detail = truckDetails[truckId];
        // Registration document (with upcoming expiry for some)
        const regExpiry = trucks.indexOf(truckId) < 3 ? '2026-07-15' : '2027-01-15';
        insertDoc.run(`DOC-REG-${truckId}`, truckId, 'registration', regExpiry, `Vehicle registration for ${truckId} - ${detail.year} ${detail.make} ${detail.model}`, JSON.stringify({ vin: detail.vin, state: 'TX', plate: `TX-${randomBetween(100, 999)}-${randomBetween(1000, 9999)}`, expiry: regExpiry }), 1);
        // Insurance document (some expiring soon)
        const insExpiry = trucks.indexOf(truckId) < 4 ? '2026-07-20' : '2027-03-01';
        insertDoc.run(`DOC-INS-${truckId}`, truckId, 'insurance', insExpiry, `Commercial auto insurance policy for ${truckId}`, JSON.stringify({ provider: 'Progressive Commercial', policy: `POL-${randomBetween(100000, 999999)}`, expiry: insExpiry, coverage: 'Full' }), 1);
        // Title document
        insertDoc.run(`DOC-TITLE-${truckId}`, truckId, 'title', `${detail.year}-06-15`, `Certificate of title for ${detail.year} ${detail.make} ${detail.model}`, JSON.stringify({ vin: detail.vin, state: 'TX', owner: 'Fleet Operations LLC' }), 1);
        // Inspection report
        const inspDate = randomDate(3, 5);
        insertDoc.run(`DOC-INSP-${truckId}`, truckId, 'inspection', inspDate, `Annual DOT inspection - ${truckId} passed`, JSON.stringify({ result: 'PASS', inspector: 'DOT Station 42', next_due: '2027-04-01' }), 1);
        // Tax form
        insertDoc.run(`DOC-TAX-${truckId}`, truckId, 'tax_form', '2026-01-15', `HVUT Form 2290 for ${truckId} - Tax Year 2025-2026`, JSON.stringify({ form: '2290', tax_year: '2025-2026', amount_paid: randomFloat(500, 600) }), 1);
        // Maintenance records (2-3 per truck)
        const maintCount = randomBetween(2, 3);
        for (let j = 0; j < maintCount; j++) {
            insertDoc.run(`DOC-MAINT-${truckId}-${j}`, truckId, 'maintenance', randomDate(1, 6), `Maintenance record - ${['Oil change', 'Brake service', 'Tire replacement', 'Engine diagnostics'][randomBetween(0, 3)]}`, JSON.stringify({ shop: 'Fleet Service Center', mileage: randomBetween(100000, 500000), items: ['Service completed'] }), 1);
        }
        // Settlement docs
        insertDoc.run(`DOC-SETTLE-${truckId}`, truckId, 'settlement', randomDate(4, 5), `Weekly settlement statement for ${truckId}`, JSON.stringify({ period: 'Week 18, 2026', gross: randomFloat(5000, 12000), deductions: randomFloat(1000, 3000) }), 1);
        // Fuel receipts
        insertDoc.run(`DOC-FUELRCPT-${truckId}`, truckId, 'fuel_receipt', randomDate(5, 6), `Fuel receipt - Pilot Travel Center`, JSON.stringify({ gallons: randomFloat(100, 200), price_per_gallon: randomFloat(3.5, 4.2), location: 'Pilot #4521, Dallas TX' }), 1);
        // Toll receipt
        insertDoc.run(`DOC-TOLLRCPT-${truckId}`, truckId, 'toll_receipt', randomDate(4, 6), `EZPass monthly toll statement`, JSON.stringify({ month: 'May 2026', total_tolls: randomFloat(150, 450), transactions: randomBetween(15, 40) }), 1);
    }
    console.log('Database seeded successfully.');
    console.log(`  - ${trucks.length} trucks with aliases`);
    console.log(`  - ${drivers.length} drivers with aliases`);
    console.log(`  - ${trailers.length} trailers with aliases`);
    console.log(`  - Expense records generated for 6 months`);
    console.log(`  - Revenue records generated for 6 months`);
    console.log(`  - 9-10 documents per truck`);
}
// Run if executed directly
if (require.main === module) {
    (0, db_1.initializeDatabase)();
    seedDatabase();
    console.log('Seed complete.');
    process.exit(0);
}
//# sourceMappingURL=seed.js.map