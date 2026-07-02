function runDashboard() {
    // -------------------------------------------------------------
    // Baseline constants and default parameters (Final Spreadsheet Spec)
    // -------------------------------------------------------------
    const defaults = {
        childrenAffected: 340,
        optOutRate: 0.70,     // 70%
        erosionRate: 0.10,    // 10%
        observationWindow: 8, // 8 years
        vehicleCostPerDay: 125,
        pupilsPerAltVehicle: 3,
        schoolDays: 190,
        schoolCareer: 5,
        s1AppealsRate: 0.45,  // 45% of actual affected children
        s2AppealsRate: 0.50,  // 50% of Stage 1
        s3OmbudRate: 0.20,    // 20% of Stage 2
        s1Cost: 150,
        s2Cost: 750,
        s3Cost: 1400,
        ongoingAdminCost: 20000,
        councilSavingsClaim: 4263445, // Annual savings at Year 8 maturity
        numberOfZones: 50,
        isolationRate: 0.25,
        minibusThreshold: 8
    };

    // -------------------------------------------------------------
    // UI Elements
    // -------------------------------------------------------------
    const inputs = {
        childrenAffected: document.getElementById('input-children-affected'),
        optOutRate: document.getElementById('input-opt-out-rate'),
        erosionRate: document.getElementById('input-erosion-rate'),
        vehicleCostPerDay: document.getElementById('input-vehicle-cost'),
        vehicleCapacity: document.getElementById('input-vehicle-capacity'),
        s1AppealsRate: document.getElementById('input-appeals-rate-s1'),
        s2AppealsRate: document.getElementById('input-appeals-rate-s2'),
        s3OmbudRate: document.getElementById('input-appeals-rate-s3'),
        s1Cost: document.getElementById('input-appeals-cost-s1'),
        s2Cost: document.getElementById('input-appeals-cost-s2'),
        s3Cost: document.getElementById('input-appeals-cost-s3'),
        ongoingAdminCost: document.getElementById('input-admin-cost'),
        councilSavingsClaim: document.getElementById('input-council-savings'),
        numberOfZones: document.getElementById('input-num-zones'),
        isolationRate: document.getElementById('input-isolation-rate'),
        minibusThreshold: document.getElementById('input-minibus-threshold')
    };

    const values = {
        childrenAffected: document.getElementById('val-children-affected'),
        optOutRate: document.getElementById('val-opt-out-rate'),
        erosionRate: document.getElementById('val-erosion-rate'),
        vehicleCostPerDay: document.getElementById('val-vehicle-cost'),
        vehicleCapacity: document.getElementById('val-vehicle-capacity'),
        s1AppealsRate: document.getElementById('val-appeals-rate-s1'),
        s2AppealsRate: document.getElementById('val-appeals-rate-s2'),
        s3OmbudRate: document.getElementById('val-appeals-rate-s3'),
        s1Cost: document.getElementById('val-appeals-cost-s1'),
        s2Cost: document.getElementById('val-appeals-cost-s2'),
        s3Cost: document.getElementById('val-appeals-cost-s3'),
        ongoingAdminCost: document.getElementById('val-admin-cost'),
        councilSavingsClaim: document.getElementById('val-council-savings'),
        numberOfZones: document.getElementById('val-num-zones'),
        isolationRate: document.getElementById('val-isolation-rate'),
        minibusThreshold: document.getElementById('val-minibus-threshold')
    };

    // Calculated read-only values in control panel
    const derivedDisplays = {
        actualAffected: document.getElementById('val-actual-affected'),
        vehiclesRequired: document.getElementById('val-vehicles-required')
    };

    const kpis = {
        netSavings: document.getElementById('kpi-net-savings'),
        netSavingsLabel: document.getElementById('kpi-net-savings-label'),
        netSubtext: document.getElementById('kpi-net-subtext'),
        netStatusBadge: document.getElementById('kpi-net-status-badge'),
        compoundedVehicleCost: document.getElementById('kpi-compounded-vehicle'),
        disputeCost: document.getElementById('kpi-dispute-cost'),
        adminCost: document.getElementById('kpi-admin-cost'),
        costCoverage: document.getElementById('kpi-cost-coverage'),
        costCoverageLabel: document.getElementById('kpi-cost-coverage-label'),
        costCoverageSubtext: document.getElementById('kpi-cost-coverage-subtext'),
        cardNetBalance: document.getElementById('card-net-balance'),
        cardCostCoverage: document.getElementById('card-cost-coverage'),
        policyVerdict: document.getElementById('kpi-policy-verdict'),
        verdictSubtext: document.getElementById('kpi-verdict-subtext'),
        cardPolicyVerdict: document.getElementById('card-policy-verdict')
    };

    const tables = {
        annualBreakdown: document.getElementById('table-annual-breakdown-body'),
        transportComparison: document.getElementById('table-transport-comparison-body'),
        appealsComparison: document.getElementById('table-appeals-comparison-body')
    };

    const buttons = {
        reset: document.getElementById('btn-reset'),
        viewCumulative: document.getElementById('btn-view-cumulative'),
        viewAnnual: document.getElementById('btn-view-annual')
    };

    // Active chart view state ('cumulative' or 'annual')
    let activeViewMode = 'cumulative';
    let chartInstance = null;

    // -------------------------------------------------------------
    // Model Calculation Engine
    // -------------------------------------------------------------
    function runModel() {
        // Read active parameters from DOM
        const childrenAffected = parseFloat(inputs.childrenAffected.value);
        const optOutRate = parseFloat(inputs.optOutRate.value) / 100;
        const erosionRate = parseFloat(inputs.erosionRate.value) / 100;
        const vehicleCostPerDay = parseFloat(inputs.vehicleCostPerDay.value);
        const pupilsPerAltVehicle = parseFloat(inputs.vehicleCapacity.value);
        const s1AppealsRate = parseFloat(inputs.s1AppealsRate.value) / 100;
        const s2AppealsRate = parseFloat(inputs.s2AppealsRate.value) / 100;
        const s3OmbudRate = parseFloat(inputs.s3OmbudRate.value) / 100;
        const ongoingAdminCost = parseFloat(inputs.ongoingAdminCost.value);
        const councilSavingsClaim = parseFloat(inputs.councilSavingsClaim.value);
        const numberOfZones = parseFloat(inputs.numberOfZones.value);
        const isolationRate = parseFloat(inputs.isolationRate.value) / 100;
        const minibusThreshold = parseFloat(inputs.minibusThreshold.value);

        // Fixed defaults for inner operations (to preserve simplicity in sidebar)
        const schoolDays = defaults.schoolDays;
        const schoolCareer = defaults.schoolCareer;
        
        // Read appeals unit costs dynamically from inputs
        const s1Cost = parseFloat(inputs.s1Cost.value);
        const s2Cost = parseFloat(inputs.s2Cost.value);
        const s3Cost = parseFloat(inputs.s3Cost.value);

        // Derived variables
        const actualAffected = Math.round(childrenAffected * (1 - optOutRate) * 100) / 100;
        
        // Calculate Base Cohort Vehicles (Year 1) dynamically using zone partitioning
        const baseCohortPop = actualAffected / numberOfZones;
        const baseIsolated = baseCohortPop * isolationRate;
        const baseIsolatedTaxis = baseIsolated / 3;
        const baseRemaining = baseCohortPop - baseIsolated;
        let baseGroupTaxis = 0;
        let baseGroupMinibuses = 0;
        if (baseRemaining < minibusThreshold) {
            baseGroupTaxis = baseRemaining / 3;
        } else {
            baseGroupMinibuses = baseRemaining / 16;
        }
        const baseCohortVehicles = (baseIsolatedTaxis + baseGroupTaxis + baseGroupMinibuses) * numberOfZones;
        const annualVehicleCost = numberOfZones * ( (baseIsolatedTaxis + baseGroupTaxis) * vehicleCostPerDay + baseGroupMinibuses * (vehicleCostPerDay * 1.5) ) * schoolDays;

        // Phased council savings weights matching the spreadsheet implementation steps
        const savingsPhasingWeights = [
            840800 / 4263445,
            1594191 / 4263445,
            2390050 / 4263445,
            3146036 / 4263445,
            3586200 / 4263445,
            4026363 / 4263445,
            4133978 / 4263445,
            1.0
        ];

        let cumulativeVehicle = 0;
        let cumulativeAppealsTotal = 0;
        let cumulativeAdmin = 0;
        let cumulativeCouncilSavings = 0;

        const yearsData = [];

        for (let t = 1; t <= 8; t++) {
            // Alternative Vehicles Spot Cost: Sum of active cohorts in system (eroded based on their career age)
            let spotVehicle = 0;
            let zonePop = 0;
            for (let age = 1; age <= Math.min(t, schoolCareer); age++) {
                zonePop += (actualAffected * Math.pow(1 - erosionRate, age - 1)) / numberOfZones;
            }
            const isolatedPupils = zonePop * isolationRate;
            const isolatedTaxis = isolatedPupils / 3;
            const remPupils = zonePop - isolatedPupils;
            let groupTaxis = 0;
            let groupMinibuses = 0;
            if (remPupils < minibusThreshold) {
                groupTaxis = remPupils / 3;
            } else {
                groupMinibuses = remPupils / 16;
            }
            const layerCostPerZone = (isolatedTaxis + groupTaxis) * vehicleCostPerDay + groupMinibuses * (vehicleCostPerDay * 1.5);
            spotVehicle = layerCostPerZone * numberOfZones * schoolDays;
            cumulativeVehicle += spotVehicle;

            // Appeals Count: intake entering in Year t decays by the erosion rate
            const cohortIntake = actualAffected * Math.pow(1 - erosionRate, t - 1);
            const s1Count = cohortIntake * s1AppealsRate;
            const s2Count = s1Count * s2AppealsRate;
            const s3Count = s2Count * s3OmbudRate;

            // Appeals Spot Cost
            const spotS1Cost = s1Count * s1Cost;
            const spotS2Cost = s2Count * s2Cost;
            const spotS3Cost = s3Count * s3Cost;
            const spotAppeals = spotS1Cost + spotS2Cost + spotS3Cost;
            cumulativeAppealsTotal += spotAppeals;

            // General Admin Cost
            const spotAdmin = ongoingAdminCost;
            cumulativeAdmin += spotAdmin;

            // Claimed Savings (Phased based on maturity weights)
            const spotCouncilSavings = councilSavingsClaim * savingsPhasingWeights[t - 1];
            cumulativeCouncilSavings += spotCouncilSavings;

            const spotTotal = spotVehicle + spotAppeals + spotAdmin;
            const cumulativeTotal = cumulativeVehicle + cumulativeAppealsTotal + cumulativeAdmin;

            const spotNetSavings = spotCouncilSavings - spotTotal;
            const cumulativeNetSavings = cumulativeCouncilSavings - cumulativeTotal;

            yearsData.push({
                year: t,
                spotVehicle,
                cumulativeVehicle,
                s1Count: Math.round(s1Count * 10) / 10,
                s2Count: Math.round(s2Count * 10) / 10,
                s3Count: Math.round(s3Count * 10) / 10,
                spotAppeals,
                cumulativeAppeals: cumulativeAppealsTotal,
                spotAdmin,
                cumulativeAdmin,
                spotTotal,
                cumulativeTotal,
                spotCouncilSavings,
                cumulativeCouncilSavings,
                spotNetSavings,
                cumulativeNetSavings
            });
        }

        return {
            actualAffected,
            baseCohortVehicles,
            annualVehicleCost,
            s1Cost,
            s2Cost,
            s3Cost,
            yearsData
        };
    }

    // -------------------------------------------------------------
    // Formatting Helpers
    // -------------------------------------------------------------
    function formatGBP(val) {
        const absolute = Math.abs(val);
        const formatted = new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
            maximumFractionDigits: 0
        }).format(absolute);
        
        return val < 0 ? `-${formatted}` : formatted;
    }

    // -------------------------------------------------------------
    // UI Render Logic
    // -------------------------------------------------------------
    function updateUI() {
        // Run model to extract calculations
        const model = runModel();
        const finalYear = model.yearsData[model.yearsData.length - 1]; // Year 8

        const vehicleCostPerDay = parseFloat(inputs.vehicleCostPerDay.value);
        const pupilsPerAltVehicle = parseFloat(inputs.vehicleCapacity.value);

        // Update read-only derived stats in control panel
        derivedDisplays.actualAffected.textContent = Math.round(model.actualAffected);
        derivedDisplays.vehiclesRequired.textContent = (model.baseCohortVehicles).toFixed(1);

        // Update KPI panels
        const cumulative7YearSavings = finalYear.cumulativeNetSavings;
        kpis.netSavings.textContent = formatGBP(cumulative7YearSavings);
        
        if (cumulative7YearSavings < 0) {
            kpis.netSavings.className = 'metric-value deficit-text';
            kpis.netSavingsLabel.textContent = '8-Year Net Cumulative Balance';
            kpis.netSubtext.textContent = 'True fiscal outcome after costs are deducted';
            
            // Status Badge
            kpis.netStatusBadge.className = 'metric-status-badge status-deficit';
            kpis.netStatusBadge.textContent = '🚨 COSTS EXCEED SAVINGS';
            
            // Card outline
            kpis.cardNetBalance.className = 'metric-card deficit-alert';

            // Policy Verdict
            kpis.policyVerdict.className = 'metric-value deficit-text';
            kpis.policyVerdict.textContent = 'Bad Policy Decision';
            kpis.verdictSubtext.textContent = 'Projected costs exceed claimed savings';
            kpis.cardPolicyVerdict.className = 'metric-card deficit-alert';
        } else {
            kpis.netSavings.className = 'metric-value savings-text';
            kpis.netSavingsLabel.textContent = '8-Year Net Cumulative Balance';
            kpis.netSubtext.textContent = 'True fiscal outcome after costs are deducted';
            
            // Status Badge
            kpis.netStatusBadge.className = 'metric-status-badge status-savings';
            kpis.netStatusBadge.textContent = '✅ SAVINGS EXCEED COSTS';
            
            // Card outline
            kpis.cardNetBalance.className = 'metric-card savings-alert';

            // Policy Verdict
            kpis.policyVerdict.className = 'metric-value savings-text';
            kpis.policyVerdict.textContent = 'Good Policy Decision';
            kpis.verdictSubtext.textContent = 'Projected savings exceed costs';
            kpis.cardPolicyVerdict.className = 'metric-card savings-alert';
        }

        kpis.compoundedVehicleCost.textContent = formatGBP(finalYear.cumulativeVehicle);
        kpis.disputeCost.textContent = formatGBP(finalYear.cumulativeAppeals);
        kpis.adminCost.textContent = formatGBP(finalYear.cumulativeAdmin);

        // Cost Coverage KPI (% of the savings eaten by costs)
        const totalSavingsClaimed = finalYear.cumulativeCouncilSavings;
        const totalCostsStag = finalYear.cumulativeTotal;
        const pctEaten = (totalCostsStag / totalSavingsClaimed) * 100;
        
        kpis.costCoverage.textContent = `${pctEaten.toFixed(0)}%`;
        if (pctEaten >= 100) {
            kpis.costCoverage.className = 'metric-value deficit-text';
            kpis.costCoverageLabel.textContent = 'Savings Completely Eradicated';
            kpis.costCoverageSubtext.textContent = `Projected costs are ${(pctEaten / 100).toFixed(1)}x higher than savings`;
            kpis.cardCostCoverage.className = 'metric-card deficit-alert';
        } else if (pctEaten >= 50) {
            kpis.costCoverage.className = 'metric-value yellow-text';
            kpis.costCoverageLabel.textContent = 'Savings Severely Eroded';
            kpis.costCoverageSubtext.textContent = `Projected costs consume ${pctEaten.toFixed(0)}% of savings`;
            kpis.cardCostCoverage.className = 'metric-card';
        } else {
            kpis.costCoverage.className = 'metric-value blue-text';
            kpis.costCoverageLabel.textContent = 'Savings Marginal Loss';
            kpis.costCoverageSubtext.textContent = `Projected costs consume ${pctEaten.toFixed(0)}% of savings`;
            kpis.cardCostCoverage.className = 'metric-card';
        }

        // Populate main breakdown table
        tables.annualBreakdown.innerHTML = '';
        model.yearsData.forEach(yr => {
            const tr = document.createElement('tr');
            
            // Highlight final year
            if (yr.year === 8) {
                tr.className = 'highlight-row';
            }

            const activeVehicle = activeViewMode === 'cumulative' ? yr.cumulativeVehicle : yr.spotVehicle;
            const activeAppeals = activeViewMode === 'cumulative' ? yr.cumulativeAppeals : yr.spotAppeals;
            const activeAdmin = activeViewMode === 'cumulative' ? yr.cumulativeAdmin : yr.spotAdmin;
            const activeTotal = activeViewMode === 'cumulative' ? yr.cumulativeTotal : yr.spotTotal;
            const activeClaimed = activeViewMode === 'cumulative' ? yr.cumulativeCouncilSavings : yr.spotCouncilSavings;
            const activeNet = activeViewMode === 'cumulative' ? yr.cumulativeNetSavings : yr.spotNetSavings;

            const academicYears = ["2025-26", "2026-27", "2027-28", "2028-29", "2029-30", "2030-31", "2031-32", "2032-33"];
            const yrLabel = academicYears[yr.year - 1] || `Year ${yr.year}`;
            tr.innerHTML = `
                <td>${yrLabel}</td>
                <td>${formatGBP(activeVehicle)}</td>
                <td>${yr.s1Count.toFixed(1)} / ${yr.s2Count.toFixed(1)} / ${yr.s3Count.toFixed(1)}</td>
                <td>${formatGBP(activeAppeals)}</td>
                <td>${formatGBP(activeAdmin)}</td>
                <td style="font-weight: 700;">${formatGBP(activeTotal)}</td>
                <td>${formatGBP(activeClaimed)}</td>
                <td style="font-weight: 700;" class="${activeNet < 0 ? 'deficit-text' : 'savings-text'}">${formatGBP(activeNet)}</td>
            `;
            tables.annualBreakdown.appendChild(tr);
        });

        // Populate Transport Unit Cost Comparison table
        const annualVehiclePerPupil = (defaults.schoolDays * vehicleCostPerDay) / pupilsPerAltVehicle;
        tables.transportComparison.innerHTML = `
            <tr>
                <td>Legacy Coach Pass (Bulk Rate)</td>
                <td>50 Pupils</td>
                <td>£42,500</td>
                <td>£850</td>
            </tr>
            <tr class="highlight-row">
                <td>Bespoke Alternative Vehicle</td>
                <td>${pupilsPerAltVehicle} Pupils (Rural Inefficient)</td>
                <td>${formatGBP(vehicleCostPerDay * defaults.schoolDays)}</td>
                <td>${formatGBP(annualVehiclePerPupil)}</td>
            </tr>
        `;

        // Populate Appeals / Administrative Costs table
        tables.appealsComparison.innerHTML = `
            <tr>
                <td>Stage 1 (Admin Review)</td>
                <td>Admissions Presenter</td>
                <td>Fully loaded staff overhead</td>
                <td>${formatGBP(model.s1Cost)}</td>
            </tr>
            <tr>
                <td>Stage 2 (Independent Panel)</td>
                <td>Clerk + Officer + Travel</td>
                <td>Quasi-judicial hearing prep + sitting</td>
                <td>${formatGBP(model.s2Cost)}</td>
            </tr>
            <tr>
                <td>Stage 3 (Ombudsman Inquiry)</td>
                <td>Info Gov + Legal + CEO</td>
                <td>LGSCO compliance & monitoring</td>
                <td>${formatGBP(model.s3Cost)}</td>
            </tr>
        `;

        // Update Year 1 At a Glance Modal HTML
        updateYear1ModalContent(model);

        // Update Chart.js Data
        renderChart(model.yearsData);
    }

    function updateYear1ModalContent(model) {
        // Read current slider inputs to display them in the modal
        const childrenAffected = parseFloat(inputs.childrenAffected.value);
        const optOutRate = parseFloat(inputs.optOutRate.value);
        const erosionRate = parseFloat(inputs.erosionRate.value);
        const vehicleCostPerDay = parseFloat(inputs.vehicleCostPerDay.value);
        const pupilsPerAltVehicle = parseFloat(inputs.vehicleCapacity.value);
        const s1AppealsRate = parseFloat(inputs.s1AppealsRate.value);
        const s2AppealsRate = parseFloat(inputs.s2AppealsRate.value);
        const s3OmbudRate = parseFloat(inputs.s3OmbudRate.value);
        const s1Cost = parseFloat(inputs.s1Cost.value);
        const s2Cost = parseFloat(inputs.s2Cost.value);
        const s3Cost = parseFloat(inputs.s3Cost.value);
        const ongoingAdminCost = parseFloat(inputs.ongoingAdminCost.value);
        const councilSavingsClaim = parseFloat(inputs.councilSavingsClaim.value);
        
        // Calculations
        const actualAffected = model.actualAffected;
        const baseCohortVehicles = model.baseCohortVehicles;
        const annualVehicleCost = model.annualVehicleCost;
        
        // Appeals math
        const s1Count = actualAffected * (s1AppealsRate / 100);
        const s2Count = s1Count * (s2AppealsRate / 100);
        const s3Count = s2Count * (s3OmbudRate / 100);
        
        const costS1 = s1Count * s1Cost;
        const costS2 = s2Count * s2Cost;
        const costS3 = s3Count * s3Cost;
        const totalAppealsCost = costS1 + costS2 + costS3;
        
        // Phased council savings weights matching the spreadsheet implementation steps
        const savingsPhasingWeights = [
            840800 / 4263445,
            1594191 / 4263445,
            2390050 / 4263445,
            3146036 / 4263445,
            3586200 / 4263445,
            4026363 / 4263445,
            4133978 / 4263445,
            1.0
        ];
        const phasedSavingsY1 = councilSavingsClaim * savingsPhasingWeights[0];
        
        const numberOfZones = parseFloat(inputs.numberOfZones.value);
        const isolationRate = parseFloat(inputs.isolationRate.value);
        const minibusThreshold = parseFloat(inputs.minibusThreshold.value);

        const totalCostY1 = annualVehicleCost + totalAppealsCost + ongoingAdminCost;
        const netY1 = phasedSavingsY1 - totalCostY1;

        const bodyElement = document.getElementById('modal-year1-body');
        if (!bodyElement) return;

        const zoneCohortPop = actualAffected / numberOfZones;
        const isolatedPupils = zoneCohortPop * (isolationRate / 100);
        const isolatedTaxis = isolatedPupils / 3;
        const remPupils = zoneCohortPop - isolatedPupils;
        let groupTaxis = 0;
        let groupMinibuses = 0;
        if (remPupils < minibusThreshold) {
            groupTaxis = remPupils / 3;
        } else {
            groupMinibuses = remPupils / 16;
        }

        bodyElement.innerHTML = `
            <p style="margin-bottom: 20px; font-size: 0.95rem;">Below is the exact step-by-step arithmetic showing how the Year 1 figures are calculated from your current slider parameters. All calculations are rounded to the nearest pound.</p>
            
            <h3 style="border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 6px; margin-top: 15px; color: var(--protest-blue); font-family: var(--font-heading); font-size: 1.25rem;">Step 1: Calculate the Displaced Student Population</h3>
            <ul style="list-style-type: none; padding-left: 0; margin-bottom: 15px;">
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Children Affected:</strong> ${childrenAffected.toLocaleString()} pupils are estimated to lose their legacy transport paths.
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Opt-Out Rate:</strong> ${optOutRate}% choose to travel independently or walk.
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Actual Displaced Cohort:</strong> <strong style="color: var(--text-primary);">${actualAffected.toFixed(1)} pupils</strong> require alternative arrangements.<br>
                    <span style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">Formula: ${childrenAffected} × (1 - ${optOutRate / 100}) = ${actualAffected.toFixed(1)}</span>
                </li>
            </ul>

            <h3 style="border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 6px; margin-top: 15px; color: var(--protest-blue); font-family: var(--font-heading); font-size: 1.25rem;">Step 2: Calculate Year 1 Transport Cost</h3>
            <ul style="list-style-type: none; padding-left: 0; margin-bottom: 15px;">
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Geographic Partition:</strong> The displaced cohort is split across ${numberOfZones} rural clusters, yielding <strong style="color: var(--text-primary);">${zoneCohortPop.toFixed(2)} pupils</strong> per zone.
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Rural Isolation:</strong> ${isolationRate}% of pupils (${isolatedPupils.toFixed(2)} per zone) require <strong style="color: var(--text-primary);">${isolatedTaxis.toFixed(2)} isolated Taxis</strong> (capacity 3).
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Consolidation Group:</strong> The remaining ${remPupils.toFixed(2)} pupils per zone are ${remPupils < minibusThreshold ? 'below' : 'above/equal to'} the minibus threshold of ${minibusThreshold}. They utilize <strong style="color: var(--text-primary);">${remPupils < minibusThreshold ? `${groupTaxis.toFixed(2)} Taxis` : `${groupMinibuses.toFixed(2)} Minibuses (at 1.5x cost)`}</strong>.
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Total Vehicles:</strong> across all ${numberOfZones} zones, we require <strong style="color: var(--text-primary);">${baseCohortVehicles.toFixed(1)} vehicles</strong>.
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Annual Transport Cost:</strong> <strong style="color: var(--text-primary);">${formatGBP(annualVehicleCost)}</strong> for Year 1 (190 school days).
                </li>
            </ul>

            <h3 style="border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 6px; margin-top: 15px; color: var(--protest-blue); font-family: var(--font-heading); font-size: 1.25rem;">Step 3: Calculate Dispute Overhead</h3>
            <ul style="list-style-type: none; padding-left: 0; margin-bottom: 15px;">
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Stage 1 (Internal Review):</strong> ${s1AppealsRate}% of displaced pupils appeal. ${s1Count.toFixed(1)} appeals at £${s1Cost} each = <strong style="color: var(--text-primary);">${formatGBP(costS1)}</strong>.
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Stage 2 (Independent Panel):</strong> ${s2AppealsRate}% of Stage 1 escalate. ${s2Count.toFixed(1)} hearings at £${s2Cost} each = <strong style="color: var(--text-primary);">${formatGBP(costS2)}</strong>.
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Stage 3 (Ombudsman):</strong> ${s3OmbudRate}% of Stage 2 escalate. ${s3Count.toFixed(1)} complaints at £${s3Cost} each = <strong style="color: var(--text-primary);">${formatGBP(costS3)}</strong>.
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Total Year 1 Dispute Cost:</strong> <strong style="color: var(--text-primary);">${formatGBP(totalAppealsCost)}</strong>.<br>
                    <span style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">Formula: ${formatGBP(costS1)} + ${formatGBP(costS2)} + ${formatGBP(costS3)} = ${formatGBP(totalAppealsCost)}</span>
                </li>
            </ul>

            <h3 style="border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 6px; margin-top: 15px; color: var(--protest-blue); font-family: var(--font-heading); font-size: 1.25rem;">Step 4: Year 1 Consolidation</h3>
            <ul style="list-style-type: none; padding-left: 0; margin-bottom: 15px;">
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>General Administration Cost:</strong> <strong style="color: var(--text-primary);">${formatGBP(ongoingAdminCost)}</strong> (mapping, database, and system overheads).
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Total Year 1 Costs:</strong> <strong style="color: var(--text-primary);">${formatGBP(totalCostY1)}</strong>.<br>
                    <span style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">Formula: ${formatGBP(annualVehicleCost)} (Transport) + ${formatGBP(totalAppealsCost)} (Disputes) + ${formatGBP(ongoingAdminCost)} (Admin) = ${formatGBP(totalCostY1)}</span>
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Phased Claimed Savings:</strong> <strong style="color: var(--text-primary);">${formatGBP(phasedSavingsY1)}</strong> (Year 1 share of the 8-year savings claim).<br>
                    <span style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">Formula: £${(councilSavingsClaim).toLocaleString()} × 19.72% (Year 1 Phasing Weight) = ${formatGBP(phasedSavingsY1)}</span>
                </li>
                <li style="margin-top: 20px; font-size: 1.05rem; padding: 15px; background: rgba(255,42,133,0.06); border-left: 3px solid ${netY1 < 0 ? 'var(--protest-pink)' : 'var(--protest-green)'}; border-radius: 0 4px 4px 0;">
                    <strong style="color: var(--text-primary);">Year 1 Year-End Net Balance:</strong> <strong class="${netY1 < 0 ? 'deficit-text' : 'savings-text'}">${formatGBP(netY1)}</strong>.<br>
                    <span style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 5px; display: block; line-height: 1.45;">
                        ${netY1 < 0 
                            ? `🚨 In Year 1, alternative vehicle and dispute costs exceed phased savings, resulting in a net deficit of <strong>${formatGBP(Math.abs(netY1))}</strong>.` 
                            : `✅ In Year 1, the policy generates a net surplus of <strong>${formatGBP(netY1)}</strong>.`
                        }
                    </span>
                </li>
            </ul>

            <h3 style="border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 6px; margin-top: 25px; color: var(--protest-blue); font-family: var(--font-heading); font-size: 1.25rem;">How This Expands Over 8 Years</h3>
            <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px;">
                Councillors often ask why costs grow so rapidly in subsequent years. The model reflects a rolling 5-year school career:
            </p>
            <ul style="list-style-type: none; padding-left: 0; margin-bottom: 15px;">
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 10px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>The Cohort Stack:</strong> Year 1 has only 1 displaced cohort (the new intake). Year 2 has 2 active displaced cohorts (Year 1's intake now in their 2nd school year, plus a brand new Year 2 intake). This stack grows every year until it peaks in Year 5 with <strong>5 active overlapping cohorts</strong>.
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 10px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Erosion (Attrition):</strong> We have provided this parameter to assume that a smaller volume of children will be affected over time as the policy becomes embedded (e.g., as families adapt, choose the nearest school, or make alternative travel arrangements). Each cohort's size is reduced by the selected <strong>Erosion Rate (${erosionRate}%)</strong> for each year they remain in the school system.
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 10px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Why Year 8 is the Final Year of the Projection:</strong> By Year 8, the policy has been in place for 8 years, and the model shows the fully matured long-term financial state of the policy, containing the steady-state overlapping student cohorts.
                </li>
            </ul>
        `;
    }

    // -------------------------------------------------------------
    // Chart.js Configuration & Rendering
    // -------------------------------------------------------------
    function renderChart(yearsData) {
        if (typeof Chart === 'undefined') {
            renderSVGChart(yearsData);
            return;
        }

        try {
            // Hide SVG if present, show Canvas
            const svg = document.getElementById('model-svg-chart');
            if (svg) svg.style.display = 'none';
            const canvas = document.getElementById('model-chart');
            if (canvas) canvas.style.display = 'block';

            const academicYears = ["2025-26", "2026-27", "2027-28", "2028-29", "2029-30", "2030-31", "2031-32", "2032-33"];
            const labels = yearsData.map(y => academicYears[y.year - 1] || `Year ${y.year}`);
            const dataClaimed = yearsData.map(y => activeViewMode === 'cumulative' ? y.cumulativeCouncilSavings : y.spotCouncilSavings);
            const dataCosts = yearsData.map(y => activeViewMode === 'cumulative' ? y.cumulativeTotal : y.spotTotal);
            const dataNet = yearsData.map(y => activeViewMode === 'cumulative' ? y.cumulativeNetSavings : y.spotNetSavings);

            if (chartInstance) {
                chartInstance.data.labels = labels;
                chartInstance.data.datasets[0].data = dataClaimed;
                chartInstance.data.datasets[1].data = dataCosts;
                chartInstance.data.datasets[2].data = dataNet;
                chartInstance.update();
            } else {
                const ctx = document.getElementById('model-chart').getContext('2d');
                
                // Custom plugin to draw zero line
                const zeroLinePlugin = {
                    id: 'zeroLine',
                    afterDraw: (chart) => {
                        const { ctx, scales: { y } } = chart;
                        const zeroY = y.getPixelForValue(0);
                        if (zeroY >= chart.chartArea.top && zeroY <= chart.chartArea.bottom) {
                            ctx.save();
                            ctx.strokeStyle = '#666666';
                            ctx.lineWidth = 1.5;
                            ctx.setLineDash([5, 5]);
                            ctx.beginPath();
                            ctx.moveTo(chart.chartArea.left, zeroY);
                            ctx.lineTo(chart.chartArea.right, zeroY);
                            ctx.stroke();
                            ctx.restore();
                        }
                    }
                };

                chartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Council Claimed Savings',
                                data: dataClaimed,
                                borderColor: '#a7f432', // lime green
                                backgroundColor: 'rgba(167, 244, 50, 0.05)',
                                borderWidth: 3,
                                pointBackgroundColor: '#a7f432',
                                tension: 0.15,
                                fill: false
                            },
                            {
                                label: 'STAG Projected Cost (Alt Vehicles+Appeals+Admin)',
                                data: dataCosts,
                                borderColor: '#ff2a85', // protest pink
                                backgroundColor: 'rgba(255, 42, 133, 0.05)',
                                borderWidth: 3,
                                pointBackgroundColor: '#ff2a85',
                                tension: 0.15,
                                fill: false
                            },
                            {
                                label: 'True Net Fiscal Balance',
                                data: dataNet,
                                borderColor: '#00d2ff', // electric blue
                                backgroundColor: 'rgba(0, 210, 255, 0.05)',
                                borderWidth: 4,
                                pointBackgroundColor: '#00d2ff',
                                pointRadius: 5,
                                pointHoverRadius: 7,
                                tension: 0.15,
                                fill: true
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                grid: {
                                    color: '#222222'
                                },
                                ticks: {
                                    color: '#aaaaaa',
                                    font: {
                                        family: 'Inter',
                                        size: 11
                                    }
                                }
                            },
                            y: {
                                grid: {
                                    color: '#222222'
                                },
                                ticks: {
                                    color: '#aaaaaa',
                                    font: {
                                        family: 'Inter',
                                        size: 11
                                    },
                                    callback: function(value) {
                                        return formatGBP(value);
                                    }
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: {
                                    color: '#ffffff',
                                    font: {
                                        family: 'Inter',
                                        size: 12,
                                        weight: 'bold'
                                    },
                                    boxWidth: 15,
                                    padding: 15
                                }
                            },
                            tooltip: {
                                backgroundColor: '#1a1a1a',
                                titleColor: '#ffffff',
                                titleFont: {
                                    family: 'Inter',
                                    weight: 'bold'
                                },
                                bodyColor: '#ffffff',
                                bodyFont: {
                                    family: 'Inter'
                                },
                                borderColor: '#333333',
                                borderWidth: 1,
                                padding: 12,
                                displayColors: true,
                                callbacks: {
                                    label: function(context) {
                                        let label = context.dataset.label || '';
                                        if (label) {
                                            label += ': ';
                                        }
                                        if (context.parsed.y !== null) {
                                            label += formatGBP(context.parsed.y);
                                        }
                                        return label;
                                    }
                                }
                            }
                        }
                    },
                    plugins: [zeroLinePlugin]
                });
            }
        } catch (e) {
            console.error("Error drawing Chart.js chart, falling back to SVG:", e);
            renderSVGChart(yearsData);
        }
    }

    function renderSVGChart(yearsData) {
        const wrapper = document.querySelector('.chart-wrapper');
        if (!wrapper) return;

        // Hide canvas if it is present
        const canvas = document.getElementById('model-chart');
        if (canvas) canvas.style.display = 'none';

        // Check if our SVG element already exists. If not, create it.
        let svg = document.getElementById('model-svg-chart');
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('id', 'model-svg-chart');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.setAttribute('viewBox', '0 0 800 380');
            svg.style.backgroundColor = '#1a1a1a';
            svg.style.borderRadius = '4px';
            svg.style.border = '1px solid #333';
            wrapper.appendChild(svg);
        } else {
            svg.style.display = 'block';
        }

        svg.innerHTML = ''; // Clear for redraw

        const academicYears = ["2025-26", "2026-27", "2027-28", "2028-29", "2029-30", "2030-31", "2031-32", "2032-33"];
        const labels = yearsData.map(y => academicYears[y.year - 1] || `Year ${y.year}`);
        const dataClaimed = yearsData.map(y => activeViewMode === 'cumulative' ? y.cumulativeCouncilSavings : y.spotCouncilSavings);
        const dataCosts = yearsData.map(y => activeViewMode === 'cumulative' ? y.cumulativeTotal : y.spotTotal);
        const dataNet = yearsData.map(y => activeViewMode === 'cumulative' ? y.cumulativeNetSavings : y.spotNetSavings);

        // Find min and max
        const allValues = [...dataClaimed, ...dataCosts, ...dataNet];
        let minVal = Math.min(...allValues);
        let maxVal = Math.max(...allValues);
        
        // Add 10% padding
        const diff = maxVal - minVal;
        minVal -= diff * 0.1;
        maxVal += diff * 0.1;
        
        if (minVal === maxVal || isNaN(diff)) {
            minVal = -15000000;
            maxVal = 5000000;
        }

        const margin = { left: 90, right: 30, top: 50, bottom: 40 };
        const width = 800;
        const height = 380;
        const graphWidth = width - margin.left - margin.right;
        const graphHeight = height - margin.top - margin.bottom;

        // Scale functions
        function getX(index) {
            return margin.left + index * (graphWidth / (yearsData.length - 1));
        }

        function getY(val) {
            return margin.top + graphHeight - ((val - minVal) / (maxVal - minVal)) * graphHeight;
        }

        // Draw grid lines and Y axis ticks
        const ticksCount = 5;
        for (let i = 0; i <= ticksCount; i++) {
            const val = minVal + i * (maxVal - minVal) / ticksCount;
            const yPos = getY(val);
            
            // Grid line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', margin.left);
            line.setAttribute('y1', yPos);
            line.setAttribute('x2', width - margin.right);
            line.setAttribute('y2', yPos);
            line.setAttribute('stroke', '#2b2b2b');
            line.setAttribute('stroke-width', '1');
            svg.appendChild(line);

            // Tick Label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', margin.left - 10);
            text.setAttribute('y', yPos + 4);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('fill', '#aaaaaa');
            text.setAttribute('font-size', '10px');
            text.setAttribute('font-family', 'Inter');
            text.textContent = formatGBP(val);
            svg.appendChild(text);
        }

        // Draw Zero Line
        if (minVal < 0 && maxVal > 0) {
            const zeroY = getY(0);
            const zeroLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            zeroLine.setAttribute('x1', margin.left);
            zeroLine.setAttribute('y1', zeroY);
            zeroLine.setAttribute('x2', width - margin.right);
            zeroLine.setAttribute('y2', zeroY);
            zeroLine.setAttribute('stroke', '#666666');
            zeroLine.setAttribute('stroke-width', '1.5');
            zeroLine.setAttribute('stroke-dasharray', '5,5');
            svg.appendChild(zeroLine);
        }

        // Draw X Axis labels
        for (let i = 0; i < yearsData.length; i++) {
            const xPos = getX(i);
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', xPos);
            text.setAttribute('y', height - margin.bottom + 20);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#aaaaaa');
            text.setAttribute('font-size', '10px');
            text.setAttribute('font-family', 'Inter');
            const academicYears = ["2025-26", "2026-27", "2027-28", "2028-29", "2029-30", "2030-31", "2031-32", "2032-33"];
            text.textContent = academicYears[i] || `Year ${i+1}`;
            svg.appendChild(text);
        }

        // Helper to build SVG path data string
        function getPathData(data) {
            return data.map((val, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(val)}`).join(' ');
        }

        // 1. Council Savings Path (lime green)
        const pathClaimed = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathClaimed.setAttribute('d', getPathData(dataClaimed));
        pathClaimed.setAttribute('fill', 'none');
        pathClaimed.setAttribute('stroke', '#a7f432');
        pathClaimed.setAttribute('stroke-width', '3');
        svg.appendChild(pathClaimed);

        // 2. STAG Projected Cost Path (protest pink)
        const pathCosts = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathCosts.setAttribute('d', getPathData(dataCosts));
        pathCosts.setAttribute('fill', 'none');
        pathCosts.setAttribute('stroke', '#ff2a85');
        pathCosts.setAttribute('stroke-width', '3');
        svg.appendChild(pathCosts);

        // 3. Net Savings Area Path
        const areaData = getPathData(dataNet) + ` L ${getX(yearsData.length - 1)} ${getY(minVal)} L ${getX(0)} ${getY(minVal)} Z`;
        const areaNet = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        areaNet.setAttribute('d', areaData);
        areaNet.setAttribute('fill', 'rgba(0, 210, 255, 0.03)');
        svg.appendChild(areaNet);

        // 4. Net Savings Line Path (electric blue)
        const pathNet = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathNet.setAttribute('d', getPathData(dataNet));
        pathNet.setAttribute('fill', 'none');
        pathNet.setAttribute('stroke', '#00d2ff');
        pathNet.setAttribute('stroke-width', '4');
        svg.appendChild(pathNet);

        // Draw Circles and text values at data points for Net Balance
        dataNet.forEach((val, idx) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', getX(idx));
            circle.setAttribute('cy', getY(val));
            circle.setAttribute('r', '4');
            circle.setAttribute('fill', '#00d2ff');
            svg.appendChild(circle);
            
            const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            txt.setAttribute('x', getX(idx));
            txt.setAttribute('y', getY(val) - 10);
            txt.setAttribute('text-anchor', 'middle');
            txt.setAttribute('fill', '#ffffff');
            txt.setAttribute('font-size', '9px');
            txt.setAttribute('font-family', 'Inter');
            txt.textContent = formatGBP(val);
            svg.appendChild(txt);
        });

        // Draw Legend
        const legendItems = [
            { label: 'Council Claimed Savings', color: '#a7f432' },
            { label: 'STAG Projected Cost', color: '#ff2a85' },
            { label: 'True Net Fiscal Balance', color: '#00d2ff' }
        ];

        legendItems.forEach((item, idx) => {
            const legX = margin.left + idx * 210;
            
            // Color indicator
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', legX);
            rect.setAttribute('y', 15);
            rect.setAttribute('width', '15');
            rect.setAttribute('height', '10');
            rect.setAttribute('fill', item.color);
            svg.appendChild(rect);

            // Label text
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', legX + 22);
            text.setAttribute('y', 24);
            text.setAttribute('fill', '#ffffff');
            text.setAttribute('font-size', '11px');
            text.setAttribute('font-family', 'Inter');
            text.setAttribute('font-weight', 'bold');
            text.textContent = item.label;
            svg.appendChild(text);
        });
    }

    // -------------------------------------------------------------
    // Event Listeners & Interactions
    // -------------------------------------------------------------
    // Live slider values updates and calculation triggers
    Object.keys(inputs).forEach(key => {
        const handleUpdate = (e) => {
            const unit = e.target.dataset.unit || '';
            let valText = e.target.value;
            
            // Format displays
            if (key === 'councilSavingsClaim') {
                valText = formatGBP(valText);
            } else if (key === 'vehicleCostPerDay' || key === 'ongoingAdminCost' || key === 's1Cost' || key === 's2Cost' || key === 's3Cost') {
                valText = '£' + parseFloat(valText).toLocaleString('en-GB');
            } else if (key === 'vehicleCapacity' || key === 'numberOfZones' || key === 'minibusThreshold') {
                valText = parseInt(valText).toString();
            }
            
            values[key].textContent = `${valText}${unit}`;
            updateUI();
        };

        inputs[key].addEventListener('input', handleUpdate);
        inputs[key].addEventListener('change', handleUpdate);
    });

    // Reset controls
    buttons.reset.addEventListener('click', () => {
        inputs.childrenAffected.value = defaults.childrenAffected;
        inputs.optOutRate.value = defaults.optOutRate * 100;
        inputs.erosionRate.value = defaults.erosionRate * 100;
        inputs.vehicleCostPerDay.value = defaults.vehicleCostPerDay;
        inputs.vehicleCapacity.value = defaults.pupilsPerAltVehicle;
        inputs.s1AppealsRate.value = defaults.s1AppealsRate * 100;
        inputs.s2AppealsRate.value = defaults.s2AppealsRate * 100;
        inputs.s3OmbudRate.value = defaults.s3OmbudRate * 100;
        inputs.s1Cost.value = defaults.s1Cost;
        inputs.s2Cost.value = defaults.s2Cost;
        inputs.s3Cost.value = defaults.s3Cost;
        inputs.ongoingAdminCost.value = defaults.ongoingAdminCost;
        inputs.councilSavingsClaim.value = defaults.councilSavingsClaim;
        inputs.numberOfZones.value = defaults.numberOfZones;
        inputs.isolationRate.value = defaults.isolationRate * 100;
        inputs.minibusThreshold.value = defaults.minibusThreshold;

        // Reset numeric value texts
        Object.keys(inputs).forEach(key => {
            const unit = inputs[key].dataset.unit || '';
            let valText = inputs[key].value;
            if (key === 'councilSavingsClaim') {
                valText = formatGBP(valText);
            } else if (key === 'vehicleCostPerDay' || key === 'ongoingAdminCost' || key === 's1Cost' || key === 's2Cost' || key === 's3Cost') {
                valText = '£' + parseFloat(valText).toLocaleString('en-GB');
            } else if (key === 'vehicleCapacity' || key === 'numberOfZones' || key === 'minibusThreshold') {
                valText = parseInt(valText).toString();
            }
            values[key].textContent = `${valText}${unit}`;
        });

        updateUI();
    });

    // Toggle views
    buttons.viewCumulative.addEventListener('click', () => {
        activeViewMode = 'cumulative';
        buttons.viewCumulative.classList.add('active');
        buttons.viewAnnual.classList.remove('active');
        updateUI();
    });

    buttons.viewAnnual.addEventListener('click', () => {
        activeViewMode = 'annual';
        buttons.viewAnnual.classList.add('active');
        buttons.viewCumulative.classList.remove('active');
        updateUI();
    });

    // Dashboard navigation tabs
    const tabHeaders = document.querySelectorAll('.tab-header');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const targetTab = header.dataset.tab;
            
            tabHeaders.forEach(h => h.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            
            header.classList.add('active');
            document.getElementById(`tab-panel-${targetTab}`).classList.add('active');
        });
    });

    // -------------------------------------------------------------
    // Initial Load
    // -------------------------------------------------------------
    // Set initial text values matching the slider defaults
    Object.keys(inputs).forEach(key => {
        const unit = inputs[key].dataset.unit || '';
        let valText = inputs[key].value;
        if (key === 'councilSavingsClaim') {
            valText = formatGBP(valText);
        } else if (key === 'vehicleCostPerDay' || key === 'ongoingAdminCost' || key === 's1Cost' || key === 's2Cost' || key === 's3Cost') {
            valText = '£' + parseFloat(valText).toLocaleString('en-GB');
        } else if (key === 'vehicleCapacity' || key === 'numberOfZones' || key === 'minibusThreshold') {
            valText = parseInt(valText).toString();
        }
        values[key].textContent = `${valText}${unit}`;
    });
    
    // Modal controls for "How this model works" & "Year 1 At a Glance"
    const modal = document.getElementById('modal-info');
    const btnHowItWorks = document.getElementById('btn-how-it-works');
    const closeBtn = document.getElementById('modal-close-btn');

    const modalY1 = document.getElementById('modal-year1');
    const btnYear1Glance = document.getElementById('btn-year1-glance');
    const closeBtnY1 = document.getElementById('modal-year1-close-btn');

    if (btnHowItWorks && modal && closeBtn) {
        btnHowItWorks.addEventListener('click', () => {
            modal.style.display = 'flex';
        });

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    if (btnYear1Glance && modalY1 && closeBtnY1) {
        btnYear1Glance.addEventListener('click', () => {
            modalY1.style.display = 'flex';
        });

        closeBtnY1.addEventListener('click', () => {
            modalY1.style.display = 'none';
        });
    }

    // Geographic Realities Modal Controls
    const modalGeog = document.getElementById('modal-geography');
    const btnGeog = document.getElementById('btn-geography');
    const closeBtnGeog = document.getElementById('modal-geography-close-btn');

    if (btnGeog && modalGeog && closeBtnGeog) {
        btnGeog.addEventListener('click', () => {
            modalGeog.style.display = 'flex';
        });

        closeBtnGeog.addEventListener('click', () => {
            modalGeog.style.display = 'none';
        });
    }

    // Close when clicking outside of either modal content box
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
        if (e.target === modalY1) {
            modalY1.style.display = 'none';
        }
        if (e.target === modalGeog) {
            modalGeog.style.display = 'none';
        }
    });

    // Initial render
    updateUI();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runDashboard);
} else {
    runDashboard();
}
