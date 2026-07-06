function runDashboard() {
    // -------------------------------------------------------------
    // Baseline constants and default parameters (Final Spreadsheet Spec)
    // -------------------------------------------------------------
    const defaults = {
        childrenAffected: 340,
        optOutRate: 0.70,     // 70%
        observationWindow: 8, // 8 years
        vehicleCostPerDay: 150, // Taxi Cost / Day
        pupilsPerAltVehicle: 3, // Pupils per Taxi
        minibusCostPerDay: 250,
        pupilsPerMinibus: 16,
        minibusThreshold: 8,
        coachCostPerDay: 500,
        pupilsPerCoach: 50,
        coachThreshold: 17,
        schoolDays: 190,
        schoolCareer: 5,
        s1AppealsRate: 0.45,  // 45% of actual affected children
        s2AppealsRate: 0.50,  // 50% of Stage 1
        s3OmbudRate: 0.20,    // 20% of Stage 2
        s1Cost: 150,
        s2Cost: 750,
        s3Cost: 1400,
        ongoingAdminCost: 30000,
        councilSavingsClaim: 4263445, // Annual savings at Year 8 maturity
        numberOfZones: 50,
        isolationRate: 0.25
    };

    // -------------------------------------------------------------
    // UI Elements
    // -------------------------------------------------------------
    const inputs = {
        childrenAffected: document.getElementById('input-children-affected'),
        optOutRate: document.getElementById('input-opt-out-rate'),
        vehicleCostPerDay: document.getElementById('input-vehicle-cost'),
        vehicleCapacity: document.getElementById('input-vehicle-capacity'),
        minibusCostPerDay: document.getElementById('input-minibus-cost'),
        pupilsPerMinibus: document.getElementById('input-minibus-capacity'),
        minibusThreshold: document.getElementById('input-minibus-threshold'),
        coachCostPerDay: document.getElementById('input-coach-cost'),
        pupilsPerCoach: document.getElementById('input-coach-capacity'),
        coachThreshold: document.getElementById('input-coach-threshold'),
        s1AppealsRate: document.getElementById('input-appeals-rate-s1'),
        s2AppealsRate: document.getElementById('input-appeals-rate-s2'),
        s3OmbudRate: document.getElementById('input-appeals-rate-s3'),
        s1Cost: document.getElementById('input-appeals-cost-s1'),
        s2Cost: document.getElementById('input-appeals-cost-s2'),
        s3Cost: document.getElementById('input-appeals-cost-s3'),
        ongoingAdminCost: document.getElementById('input-admin-cost'),
        councilSavingsClaim: document.getElementById('input-council-savings'),
        numberOfZones: document.getElementById('input-num-zones'),
        isolationRate: document.getElementById('input-isolation-rate')
    };

    const values = {
        childrenAffected: document.getElementById('val-children-affected'),
        optOutRate: document.getElementById('val-opt-out-rate'),
        vehicleCostPerDay: document.getElementById('val-vehicle-cost'),
        vehicleCapacity: document.getElementById('val-vehicle-capacity'),
        minibusCostPerDay: document.getElementById('val-minibus-cost'),
        pupilsPerMinibus: document.getElementById('val-minibus-capacity'),
        minibusThreshold: document.getElementById('val-minibus-threshold'),
        coachCostPerDay: document.getElementById('val-coach-cost'),
        pupilsPerCoach: document.getElementById('val-coach-capacity'),
        coachThreshold: document.getElementById('val-coach-threshold'),
        s1AppealsRate: document.getElementById('val-appeals-rate-s1'),
        s2AppealsRate: document.getElementById('val-appeals-rate-s2'),
        s3OmbudRate: document.getElementById('val-appeals-rate-s3'),
        s1Cost: document.getElementById('val-appeals-cost-s1'),
        s2Cost: document.getElementById('val-appeals-cost-s2'),
        s3Cost: document.getElementById('val-appeals-cost-s3'),
        ongoingAdminCost: document.getElementById('val-admin-cost'),
        councilSavingsClaim: document.getElementById('val-council-savings'),
        numberOfZones: document.getElementById('val-num-zones'),
        isolationRate: document.getElementById('val-isolation-rate')
    };

    // Calculated read-only values in control panel
    const derivedDisplays = {
        actualAffected: document.getElementById('val-actual-affected')
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
        const vehicleCostPerDay = parseFloat(inputs.vehicleCostPerDay.value);
        const pupilsPerAltVehicle = parseFloat(inputs.vehicleCapacity.value);
        const minibusCostPerDay = parseFloat(inputs.minibusCostPerDay.value);
        const pupilsPerMinibus = parseFloat(inputs.pupilsPerMinibus.value);
        const minibusThreshold = parseFloat(inputs.minibusThreshold.value);
        const coachCostPerDay = parseFloat(inputs.coachCostPerDay.value);
        const pupilsPerCoach = parseFloat(inputs.pupilsPerCoach.value);
        const coachThreshold = parseFloat(inputs.coachThreshold.value);
        const s1AppealsRate = parseFloat(inputs.s1AppealsRate.value) / 100;
        const s2AppealsRate = parseFloat(inputs.s2AppealsRate.value) / 100;
        const s3OmbudRate = parseFloat(inputs.s3OmbudRate.value) / 100;
        const ongoingAdminCost = parseFloat(inputs.ongoingAdminCost.value);
        const councilSavingsClaim = parseFloat(inputs.councilSavingsClaim.value);
        const numberOfZones = parseFloat(inputs.numberOfZones.value);
        const isolationRate = parseFloat(inputs.isolationRate.value) / 100;

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
        const baseIsolatedTaxis = baseIsolated / pupilsPerAltVehicle;
        const baseRemaining = baseCohortPop - baseIsolated;
        let baseGroupTaxis = 0;
        let baseGroupMinibuses = 0;
        let baseGroupCoaches = 0;
        if (baseRemaining < minibusThreshold) {
            baseGroupTaxis = baseRemaining / pupilsPerAltVehicle;
        } else if (baseRemaining < coachThreshold) {
            baseGroupMinibuses = baseRemaining / pupilsPerMinibus;
        } else {
            baseGroupCoaches = baseRemaining / pupilsPerCoach;
        }
        const baseCohortVehicles = (baseIsolatedTaxis + baseGroupTaxis + baseGroupMinibuses + baseGroupCoaches) * numberOfZones;
        const annualVehicleCost = numberOfZones * ( 
            (baseIsolatedTaxis + baseGroupTaxis) * vehicleCostPerDay + 
            baseGroupMinibuses * minibusCostPerDay +
            baseGroupCoaches * coachCostPerDay
        ) * schoolDays;

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
            // Alternative Vehicles Spot Cost: Sum of active cohorts in system (no longer eroded)
            let spotVehicle = 0;
            let zonePop = 0;
            for (let age = 1; age <= Math.min(t, schoolCareer); age++) {
                zonePop += actualAffected / numberOfZones;
            }
            const isolatedPupils = zonePop * isolationRate;
            const isolatedTaxis = isolatedPupils / pupilsPerAltVehicle;
            const remPupils = zonePop - isolatedPupils;
            let groupTaxis = 0;
            let groupMinibuses = 0;
            let groupCoaches = 0;
            if (remPupils < minibusThreshold) {
                groupTaxis = remPupils / pupilsPerAltVehicle;
            } else if (remPupils < coachThreshold) {
                groupMinibuses = remPupils / pupilsPerMinibus;
            } else {
                groupCoaches = remPupils / pupilsPerCoach;
            }
            const layerCostPerZone = (isolatedTaxis + groupTaxis) * vehicleCostPerDay + 
                                     groupMinibuses * minibusCostPerDay +
                                     groupCoaches * coachCostPerDay;
            spotVehicle = layerCostPerZone * numberOfZones * schoolDays;
            cumulativeVehicle += spotVehicle;

            // Appeals Count: intake entering in Year t
            const cohortIntake = actualAffected;
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
        
        // Update Geographic Realities Modal HTML
        updateGeographyModalContent();

        // Update Chart.js Data
        renderChart(model.yearsData);
    }

    function updateGeographyModalContent() {
        const numberOfZones = parseFloat(inputs.numberOfZones.value);
        const isolationRate = parseFloat(inputs.isolationRate.value);
        const minibusThreshold = parseFloat(inputs.minibusThreshold.value);
        const coachThreshold = parseFloat(inputs.coachThreshold.value);
        
        const vehicleCostPerDay = parseFloat(inputs.vehicleCostPerDay.value);
        const pupilsPerAltVehicle = parseFloat(inputs.vehicleCapacity.value);
        const minibusCostPerDay = parseFloat(inputs.minibusCostPerDay.value);
        const pupilsPerMinibus = parseFloat(inputs.pupilsPerMinibus.value);
        const coachCostPerDay = parseFloat(inputs.coachCostPerDay.value);
        const pupilsPerCoach = parseFloat(inputs.pupilsPerCoach.value);

        const bodyElement = document.getElementById('modal-geography-body');
        if (!bodyElement) return;

        bodyElement.innerHTML = `
            <h3>Why ${numberOfZones} Zones?</h3>
            <p>This number directly maps to the ${numberOfZones} distinct rural primary school feeder clusters across North Yorkshire. The council's "nearest school" shift impacts specific village lines and primary communities, not entire towns evenly. Dividing the baseline across ${numberOfZones} feeder clusters yields roughly ${(inputs.childrenAffected.value * (1 - inputs.optOutRate.value/100) / numberOfZones).toFixed(1)} children per community per year, ensuring the model assumes children are scattered across ${numberOfZones} separate micro-geographies rather than allowing impossible county-wide routing efficiencies.</p>
            
            <h3>The Isolation Rate (${isolationRate}%)</h3>
            <p>Recognises that ${isolationRate}% of deeply rural pupils live down isolated lanes or single-track roads. They can never be grouped into a larger route without causing unacceptable transit times, leaving them permanently reliant on individual Taxi contracts (capacity of ${pupilsPerAltVehicle} pupils, costing £${vehicleCostPerDay}/day).</p>
            
            <h3>The Minibus Threshold (${minibusThreshold} Pupils)</h3>
            <p>Models how costs behave in the real world. Only when the 5-year cohort stack builds up over time do village clusters reach a critical mass of ${minibusThreshold} pupils, allowing the council to upgrade to a consolidated Minibus contract (capacity of ${pupilsPerMinibus} pupils, costing £${minibusCostPerDay}/day).</p>
            
            <h3>The Coach Threshold (${coachThreshold} Pupils)</h3>
            <p>Models the long-term saturation of the policy. In Years 5–8, as the rolling 5-year cohort stack completely fills up, certain high-density primary feeder zones will hit critical mass (${coachThreshold}+ active pupils). At this point, the model dynamically rewards the council by consolidating the minibus route back into a full-capacity Coach contract (capacity of ${pupilsPerCoach} pupils, costing £${coachCostPerDay}/day), accurately reflecting the long-term stabilization of a fully embedded transport network.</p>
        `;
    }

    function updateYear1ModalContent(model) {
        // Read current slider inputs to display them in the modal
        const childrenAffected = parseFloat(inputs.childrenAffected.value);
        const optOutRate = parseFloat(inputs.optOutRate.value);
        const vehicleCostPerDay = parseFloat(inputs.vehicleCostPerDay.value);
        const pupilsPerAltVehicle = parseFloat(inputs.vehicleCapacity.value);
        const minibusCostPerDay = parseFloat(inputs.minibusCostPerDay.value);
        const pupilsPerMinibus = parseFloat(inputs.pupilsPerMinibus.value);
        const coachCostPerDay = parseFloat(inputs.coachCostPerDay.value);
        const pupilsPerCoach = parseFloat(inputs.pupilsPerCoach.value);
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
        const coachThreshold = parseFloat(inputs.coachThreshold.value);

        const totalCostY1 = annualVehicleCost + totalAppealsCost + ongoingAdminCost;
        const netY1 = phasedSavingsY1 - totalCostY1;

        const bodyElement = document.getElementById('modal-year1-body');
        if (!bodyElement) return;

        const zoneCohortPop = actualAffected / numberOfZones;
        const isolatedPupils = zoneCohortPop * (isolationRate / 100);
        const isolatedTaxis = isolatedPupils / pupilsPerAltVehicle;
        const remPupils = zoneCohortPop - isolatedPupils;
        let groupTaxis = 0;
        let groupMinibuses = 0;
        let groupCoaches = 0;
        let groupText = '';
        if (remPupils < minibusThreshold) {
            groupTaxis = remPupils / pupilsPerAltVehicle;
            groupText = `${groupTaxis.toFixed(2)} Taxis (capacity: ${pupilsPerAltVehicle}, cost: £${vehicleCostPerDay})`;
        } else if (remPupils < coachThreshold) {
            groupMinibuses = remPupils / pupilsPerMinibus;
            groupText = `${groupMinibuses.toFixed(2)} Minibuses (capacity: ${pupilsPerMinibus}, cost: £${minibusCostPerDay})`;
        } else {
            groupCoaches = remPupils / pupilsPerCoach;
            groupText = `${groupCoaches.toFixed(2)} Coaches (capacity: ${pupilsPerCoach}, cost: £${coachCostPerDay})`;
        }

        bodyElement.innerHTML = `
            <p style="margin-bottom: 20px; font-size: 0.95rem;">Here is a simple, step-by-step breakdown of how the Year 1 costs and savings are worked out using your current settings.</p>
            
            <h3 style="border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 6px; margin-top: 15px; color: var(--protest-blue); font-family: var(--font-heading); font-size: 1.25rem;">1. Number of Children Needing Transport</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 10px; font-style: italic;">
                <strong>Why this matters:</strong> The more children who lose transport rights—or the fewer families who make their own travel arrangements—the more individual vehicle contracts and parental appeals the Council must pay for.
            </p>
            <ul style="list-style-type: none; padding-left: 0; margin-bottom: 15px;">
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Children affected by policy cut:</strong> ${childrenAffected.toLocaleString()} pupils.
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Opt-out rate:</strong> ${optOutRate}% of families find their own way to school (e.g. walking or driving).
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Children needing council transport:</strong> <strong style="color: var(--text-primary);">${actualAffected.toFixed(1)} pupils</strong>.<br>
                    <span style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">Formula: ${childrenAffected} children × (100% - ${optOutRate}%) = ${actualAffected.toFixed(1)} children</span>
                </li>
            </ul>

            <h3 style="border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 6px; margin-top: 15px; color: var(--protest-blue); font-family: var(--font-heading); font-size: 1.25rem;">2. Working Out Year 1 Transport Costs</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 10px; font-style: italic;">
                <strong>Why this matters:</strong> In rural areas, we cannot easily put all children onto a single large bus. Isolated pupils must travel alone in taxis, while the rest are grouped into taxis, minibuses, or coaches depending on how many live in each village cluster.
            </p>
            <ul style="list-style-type: none; padding-left: 0; margin-bottom: 15px;">
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Village clusters / corridors:</strong> The cohort is split across ${numberOfZones} zones, yielding <strong style="color: var(--text-primary);">${zoneCohortPop.toFixed(2)} pupils</strong> per zone.
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Isolated pupils (no group transport):</strong> ${isolationRate}% (${isolatedPupils.toFixed(2)} per zone) live down remote single-track lanes. They require <strong style="color: var(--text-primary);">${isolatedTaxis.toFixed(2)} Taxis</strong> (capacity: ${pupilsPerAltVehicle}, cost: £${vehicleCostPerDay}/day).
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Consolidated pupils (grouped together):</strong> The remaining ${remPupils.toFixed(2)} pupils travel together. The model chooses a vehicle based on minibus and coach triggers. Currently utilizing: <strong style="color: var(--text-primary);">${groupText}</strong>.
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Total Year 1 vehicles:</strong> Across all ${numberOfZones} village zones, we require <strong style="color: var(--text-primary);">${baseCohortVehicles.toFixed(1)} vehicles</strong>.
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Annual transport cost:</strong> <strong style="color: var(--text-primary);">${formatGBP(annualVehicleCost)}</strong> for the school year (190 school days).
                </li>
            </ul>

            <h3 style="border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 6px; margin-top: 15px; color: var(--protest-blue); font-family: var(--font-heading); font-size: 1.25rem;">3. Adding the Costs of Parental Appeals</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 10px; font-style: italic;">
                <strong>Why this matters:</strong> Cutting school transport triggers parent appeals. A percentage of families escalate their cases to formal reviews, independent appeal panels, and the Local Government Ombudsman, generating heavy admin and legal costs for the Council.
            </p>
            <ul style="list-style-type: none; padding-left: 0; margin-bottom: 15px;">
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Stage 1 (Internal Review):</strong> ${s1AppealsRate}% of pupils appeal. ${s1Count.toFixed(1)} appeals at £${s1Cost} each = <strong style="color: var(--text-primary);">${formatGBP(costS1)}</strong>.
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Stage 2 (Independent Panel):</strong> ${s2AppealsRate}% of Stage 1 escalate. ${s2Count.toFixed(1)} hearings at £${s2Cost} each = <strong style="color: var(--text-primary);">${formatGBP(costS2)}</strong>.
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Stage 3 (Ombudsman Review):</strong> ${s3OmbudRate}% of Stage 2 escalate. ${s3Count.toFixed(1)} cases at £${s3Cost} each = <strong style="color: var(--text-primary);">${formatGBP(costS3)}</strong>.
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Total Year 1 appeal cost:</strong> <strong style="color: var(--text-primary);">${formatGBP(totalAppealsCost)}</strong>.<br>
                    <span style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">Formula: Stage 1 (${formatGBP(costS1)}) + Stage 2 (${formatGBP(costS2)}) + Stage 3 (${formatGBP(costS3)}) = ${formatGBP(totalAppealsCost)}</span>
                </li>
            </ul>

            <h3 style="border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 6px; margin-top: 15px; color: var(--protest-blue); font-family: var(--font-heading); font-size: 1.25rem;">4. The Year 1 Final Bill</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 10px; font-style: italic;">
                <strong>Why this matters:</strong> This sums up transport, appeals, and system admin costs (£${ongoingAdminCost.toLocaleString()}/year) and compares the total against the savings the Council claims they will achieve in Year 1.
            </p>
            <ul style="list-style-type: none; padding-left: 0; margin-bottom: 15px;">
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>General Admin overhead:</strong> <strong style="color: var(--text-primary);">${formatGBP(ongoingAdminCost)}</strong> (mapping database, route reviews).
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Total actual costs:</strong> <strong style="color: var(--text-primary);">${formatGBP(totalCostY1)}</strong>.<br>
                    <span style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">Formula: Transport (${formatGBP(annualVehicleCost)}) + Appeals (${formatGBP(totalAppealsCost)}) + Admin (${formatGBP(ongoingAdminCost)}) = ${formatGBP(totalCostY1)}</span>
                </li>
                <li style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px; padding-left: 15px; position: relative;">
                    <span style="position: absolute; left: 0; color: var(--protest-pink); font-size: 8px; top: 4px;">■</span>
                    <strong>Phased savings claimed:</strong> <strong style="color: var(--text-primary);">${formatGBP(phasedSavingsY1)}</strong> (Year 1 share of the £${(councilSavingsClaim).toLocaleString()} Year 8 target).<br>
                    <span style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">Formula: £${(councilSavingsClaim).toLocaleString()} target × 19.72% Year 1 share = ${formatGBP(phasedSavingsY1)}</span>
                </li>
                <li style="margin-top: 20px; font-size: 1.05rem; padding: 15px; background: rgba(255,42,133,0.06); border-left: 3px solid ${netY1 < 0 ? 'var(--protest-pink)' : 'var(--protest-green)'}; border-radius: 0 4px 4px 0;">
                    <strong style="color: var(--text-primary);">Year 1 net balance:</strong> <strong class="${netY1 < 0 ? 'deficit-text' : 'savings-text'}">${formatGBP(netY1)}</strong>.<br>
                    <span style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 5px; display: block; line-height: 1.45;">
                        ${netY1 < 0 
                            ? `🚨 In Year 1, transport, dispute, and admin costs exceed the claimed savings, leaving the Council with a net deficit of <strong>${formatGBP(Math.abs(netY1))}</strong>.` 
                            : `✅ In Year 1, the policy is successful and generates a net surplus of <strong>${formatGBP(netY1)}</strong>.`
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
            } else if (key === 'vehicleCostPerDay' || key === 'minibusCostPerDay' || key === 'coachCostPerDay' || key === 'ongoingAdminCost' || key === 's1Cost' || key === 's2Cost' || key === 's3Cost') {
                valText = '£' + parseFloat(valText).toLocaleString('en-GB');
            } else if (key === 'vehicleCapacity' || key === 'minibusCapacity' || key === 'coachCapacity' || key === 'numberOfZones' || key === 'minibusThreshold' || key === 'coachThreshold') {
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
        inputs.vehicleCostPerDay.value = defaults.vehicleCostPerDay;
        inputs.vehicleCapacity.value = defaults.pupilsPerAltVehicle;
        inputs.minibusCostPerDay.value = defaults.minibusCostPerDay;
        inputs.pupilsPerMinibus.value = defaults.pupilsPerMinibus;
        inputs.minibusThreshold.value = defaults.minibusThreshold;
        inputs.coachCostPerDay.value = defaults.coachCostPerDay;
        inputs.pupilsPerCoach.value = defaults.pupilsPerCoach;
        inputs.coachThreshold.value = defaults.coachThreshold;
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

        // Reset numeric value texts
        Object.keys(inputs).forEach(key => {
            const unit = inputs[key].dataset.unit || '';
            let valText = inputs[key].value;
            if (key === 'councilSavingsClaim') {
                valText = formatGBP(valText);
            } else if (key === 'vehicleCostPerDay' || key === 'minibusCostPerDay' || key === 'coachCostPerDay' || key === 'ongoingAdminCost' || key === 's1Cost' || key === 's2Cost' || key === 's3Cost') {
                valText = '£' + parseFloat(valText).toLocaleString('en-GB');
            } else if (key === 'vehicleCapacity' || key === 'minibusCapacity' || key === 'coachCapacity' || key === 'numberOfZones' || key === 'minibusThreshold' || key === 'coachThreshold') {
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
    let plainTextTrace = "";

    function updateTraceModalContent() {
        // Read DOM inputs
        const childrenAffected = parseFloat(inputs.childrenAffected.value);
        const optOutRate = parseFloat(inputs.optOutRate.value) / 100;
        const vehicleCostPerDay = parseFloat(inputs.vehicleCostPerDay.value);
        const pupilsPerAltVehicle = parseFloat(inputs.vehicleCapacity.value);
        const minibusCostPerDay = parseFloat(inputs.minibusCostPerDay.value);
        const pupilsPerMinibus = parseFloat(inputs.pupilsPerMinibus.value);
        const minibusThreshold = parseFloat(inputs.minibusThreshold.value);
        const coachCostPerDay = parseFloat(inputs.coachCostPerDay.value);
        const pupilsPerCoach = parseFloat(inputs.pupilsPerCoach.value);
        const coachThreshold = parseFloat(inputs.coachThreshold.value);
        const s1AppealsRate = parseFloat(inputs.s1AppealsRate.value) / 100;
        const s2AppealsRate = parseFloat(inputs.s2AppealsRate.value) / 100;
        const s3OmbudRate = parseFloat(inputs.s3OmbudRate.value) / 100;
        const ongoingAdminCost = parseFloat(inputs.ongoingAdminCost.value);
        const councilSavingsClaim = parseFloat(inputs.councilSavingsClaim.value);
        const numberOfZones = parseFloat(inputs.numberOfZones.value);
        const isolationRate = parseFloat(inputs.isolationRate.value) / 100;

        const schoolDays = defaults.schoolDays;
        const schoolCareer = defaults.schoolCareer;
        const s1Cost = parseFloat(inputs.s1Cost.value);
        const s2Cost = parseFloat(inputs.s2Cost.value);
        const s3Cost = parseFloat(inputs.s3Cost.value);

        // Run calculation variables
        const actualAffected = Math.round(childrenAffected * (1 - optOutRate) * 100) / 100;
        
        // Year 1 detailed splits
        const zoneCohortPop = actualAffected / numberOfZones;
        const isolatedPupils = zoneCohortPop * isolationRate;
        const isolatedTaxis = isolatedPupils / pupilsPerAltVehicle;
        const remPupils = zoneCohortPop - isolatedPupils;
        
        let groupTaxis = 0;
        let groupMinibuses = 0;
        let groupCoaches = 0;
        let vehicleTypeUsed = "";
        let groupMathText = "";
        
        if (remPupils < minibusThreshold) {
            groupTaxis = remPupils / pupilsPerAltVehicle;
            vehicleTypeUsed = "Taxi";
            groupMathText = `Remaining pupils (${remPupils.toFixed(2)}) is less than Minibus Threshold (${minibusThreshold}), utilizing Taxis (capacity: ${pupilsPerAltVehicle}, cost: £${vehicleCostPerDay}/day).<br>` +
                            `Formula: Remaining Pupils (${remPupils.toFixed(2)}) / Taxi Capacity (${pupilsPerAltVehicle}) = ${groupTaxis.toFixed(2)} group taxis per zone.`;
        } else if (remPupils < coachThreshold) {
            groupMinibuses = remPupils / pupilsPerMinibus;
            vehicleTypeUsed = "Minibus";
            groupMathText = `Remaining pupils (${remPupils.toFixed(2)}) is greater than or equal to Minibus Threshold (${minibusThreshold}) but less than Coach Threshold (${coachThreshold}), utilizing Minibuses (capacity: ${pupilsPerMinibus}, cost: £${minibusCostPerDay}/day).<br>` +
                            `Formula: Remaining Pupils (${remPupils.toFixed(2)}) / Minibus Capacity (${pupilsPerMinibus}) = ${groupMinibuses.toFixed(2)} group minibuses per zone.`;
        } else {
            groupCoaches = remPupils / pupilsPerCoach;
            vehicleTypeUsed = "Coach";
            groupMathText = `Remaining pupils (${remPupils.toFixed(2)}) is greater than or equal to Coach Threshold (${coachThreshold}), utilizing Coaches (capacity: ${pupilsPerCoach}, cost: £${coachCostPerDay}/day).<br>` +
                            `Formula: Remaining Pupils (${remPupils.toFixed(2)}) / Coach Capacity (${pupilsPerCoach}) = ${groupCoaches.toFixed(2)} group coaches per zone.`;
        }

        const taxisPerZone = isolatedTaxis + groupTaxis;
        const minibusesPerZone = groupMinibuses;
        const coachesPerZone = groupCoaches;

        const zoneCostPerDay = (taxisPerZone * vehicleCostPerDay) + 
                               (minibusesPerZone * minibusCostPerDay) + 
                               (coachesPerZone * coachCostPerDay);
        const totalDailyCost = zoneCostPerDay * numberOfZones;
        const annualVehicleCost = totalDailyCost * schoolDays;

        // Appeals Year 1
        const s1Count = actualAffected * s1AppealsRate;
        const s2Count = s1Count * s2AppealsRate;
        const s3Count = s2Count * s3OmbudRate;

        const costS1 = s1Count * s1Cost;
        const costS2 = s2Count * s2Cost;
        const costS3 = s3Count * s3Cost;
        const totalAppealsCost = costS1 + costS2 + costS3;

        // Year 1 Total
        const totalCostY1 = annualVehicleCost + totalAppealsCost + ongoingAdminCost;
        
        // Phased Council Savings weights
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
        const netY1 = phasedSavingsY1 - totalCostY1;

        // 8-Year Loop data
        let cumulativeVehicle = 0;
        let cumulativeAppealsTotal = 0;
        let cumulativeAdmin = 0;
        let cumulativeCouncilSavings = 0;
        const yearsTraceData = [];

        for (let t = 1; t <= 8; t++) {
            let zonePop = 0;
            for (let age = 1; age <= Math.min(t, schoolCareer); age++) {
                zonePop += actualAffected / numberOfZones;
            }
            const tIsolatedPupils = zonePop * isolationRate;
            const tIsolatedTaxis = tIsolatedPupils / pupilsPerAltVehicle;
            const tRemPupils = zonePop - tIsolatedPupils;
            
            let tGroupTaxis = 0;
            let tGroupMinibuses = 0;
            let tGroupCoaches = 0;
            if (tRemPupils < minibusThreshold) {
                tGroupTaxis = tRemPupils / pupilsPerAltVehicle;
            } else if (tRemPupils < coachThreshold) {
                tGroupMinibuses = tRemPupils / pupilsPerMinibus;
            } else {
                tGroupCoaches = tRemPupils / pupilsPerCoach;
            }
            const tLayerCostPerZone = (tIsolatedTaxis + tGroupTaxis) * vehicleCostPerDay + 
                                     tGroupMinibuses * minibusCostPerDay +
                                     tGroupCoaches * coachCostPerDay;
            const tSpotVehicle = tLayerCostPerZone * numberOfZones * schoolDays;
            cumulativeVehicle += tSpotVehicle;

            const tS1Count = actualAffected * s1AppealsRate;
            const tS2Count = tS1Count * s2AppealsRate;
            const tS3Count = tS2Count * s3OmbudRate;

            const tSpotAppeals = (tS1Count * s1Cost) + (tS2Count * s2Cost) + (tS3Count * s3Cost);
            cumulativeAppealsTotal += tSpotAppeals;

            const tSpotAdmin = ongoingAdminCost;
            cumulativeAdmin += tSpotAdmin;

            const tSpotCouncilSavings = councilSavingsClaim * savingsPhasingWeights[t - 1];
            cumulativeCouncilSavings += tSpotCouncilSavings;

            const tSpotTotal = tSpotVehicle + tSpotAppeals + tSpotAdmin;
            const tCumulativeTotal = cumulativeVehicle + cumulativeAppealsTotal + cumulativeAdmin;

            const tSpotNetSavings = tSpotCouncilSavings - tSpotTotal;
            const tCumulativeNetSavings = cumulativeCouncilSavings - tCumulativeTotal;

            yearsTraceData.push({
                year: t,
                activeCohorts: Math.min(t, schoolCareer),
                spotVehicle: tSpotVehicle,
                cumulativeVehicle,
                spotAppeals: tSpotAppeals,
                cumulativeAppeals: cumulativeAppealsTotal,
                spotAdmin: tSpotAdmin,
                cumulativeAdmin,
                spotTotal: tSpotTotal,
                cumulativeTotal: tCumulativeTotal,
                spotSavings: tSpotCouncilSavings,
                cumulativeSavings: cumulativeCouncilSavings,
                spotNet: tSpotNetSavings,
                cumulativeNet: tCumulativeNetSavings
            });
        }

        const finalYear = yearsTraceData[7];

        // Format HTML
        const bodyElement = document.getElementById('modal-trace-body');
        if (bodyElement) {
            bodyElement.innerHTML = `
                <p style="font-size: 0.95rem; margin-bottom: 20px; line-height: 1.5; color: var(--text-secondary);">
                    This diagnostic trace presents the detailed step-by-step arithmetic and logic sequence underlying the financial dashboard. Change slider parameters to instantly recalculate and observe the mathematical progression.
                </p>

                <!-- Active inputs overview -->
                <div class="trace-step">
                    <h3>1. Active Model Parameters (Current State)</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; font-size: 0.85rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); padding: 12px; border-radius: 4px;">
                        <div><strong>Children Affected:</strong> ${childrenAffected.toLocaleString()}</div>
                        <div><strong>Opt-Out Rate:</strong> ${(optOutRate * 100).toFixed(0)}%</div>
                        <div><strong>Actual Affected:</strong> ${actualAffected.toFixed(2)}</div>
                        <div><strong>Feeder Zones / Clusters:</strong> ${numberOfZones}</div>
                        <div><strong>Isolation Rate:</strong> ${(isolationRate * 100).toFixed(0)}%</div>
                        <div><strong>Taxi Cost/Day:</strong> ${formatGBP(vehicleCostPerDay)} (cap: ${pupilsPerAltVehicle})</div>
                        <div><strong>Minibus Cost/Day:</strong> ${formatGBP(minibusCostPerDay)} (cap: ${pupilsPerMinibus})</div>
                        <div><strong>Minibus Threshold:</strong> ${minibusThreshold}</div>
                        <div><strong>Coach Cost/Day:</strong> ${formatGBP(coachCostPerDay)} (cap: ${pupilsPerCoach})</div>
                        <div><strong>Coach Threshold:</strong> ${coachThreshold}</div>
                        <div><strong>Stage 1 Appeal Cost:</strong> ${formatGBP(s1Cost)} (rate: ${(s1AppealsRate * 100).toFixed(0)}%)</div>
                        <div><strong>Stage 2 Appeal Cost:</strong> ${formatGBP(s2Cost)} (rate: ${(s2AppealsRate * 100).toFixed(0)}%)</div>
                        <div><strong>Stage 3 Appeal Cost:</strong> ${formatGBP(s3Cost)} (rate: ${(s3OmbudRate * 100).toFixed(0)}%)</div>
                        <div><strong>Annual Admin Cost:</strong> ${formatGBP(ongoingAdminCost)}</div>
                        <div><strong>Council Savings Claim:</strong> ${formatGBP(councilSavingsClaim)}</div>
                        <div><strong>School Days / Year:</strong> ${schoolDays}</div>
                    </div>
                </div>

                <!-- Step 1: Affected children -->
                <div class="trace-step">
                    <h3>2. Net Children Requiring Transport</h3>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);">
                        Calculates the actual number of children who will receive council transport support, after subtracting the families who opt out and arrange their own travel.
                    </p>
                    <div class="formula-box">
                        Actual Affected Pupils = Children Affected &times; (100% - Opt-Out Rate)<br>
                        Actual Affected Pupils = ${childrenAffected.toLocaleString()} &times; (100% - ${(optOutRate * 100).toFixed(0)}%) = ${actualAffected.toFixed(2)} pupils
                    </div>
                </div>

                <!-- Step 2: Geographic partition & vehicle math -->
                <div class="trace-step">
                    <h3>3. Route Fracturing &amp; Alternative Vehicle Allocations (Year 1)</h3>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);">
                        Because catchment transport is cut, children are divided across separate feeder communities (Zones). We model the vehicle requirements of a single zone and multiply by the total number of zones.
                    </p>
                    <ul style="list-style-type: none; padding-left: 0; font-size: 0.85rem;">
                        <li style="margin-bottom: 6px; padding-left: 12px; position: relative;">
                            <span style="position: absolute; left: 0; color: var(--protest-pink);">■</span>
                            <strong>Pupils per Zone:</strong> ${actualAffected.toFixed(2)} / ${numberOfZones} zones = ${zoneCohortPop.toFixed(4)} pupils per zone.
                        </li>
                        <li style="margin-bottom: 6px; padding-left: 12px; position: relative;">
                            <span style="position: absolute; left: 0; color: var(--protest-pink);">■</span>
                            <strong>Isolated pupils (Taxi-reliant):</strong> ${zoneCohortPop.toFixed(4)} pupils/zone &times; ${(isolationRate * 100).toFixed(0)}% isolation rate = ${isolatedPupils.toFixed(4)} isolated pupils/zone.<br>
                            These pupils cannot share routes due to remote locations and require Taxis (capacity: ${pupilsPerAltVehicle}).<br>
                            Isolated Taxis = ${isolatedPupils.toFixed(4)} pupils / ${pupilsPerAltVehicle} capacity = <strong>${isolatedTaxis.toFixed(4)} Taxis per zone</strong>.
                        </li>
                        <li style="margin-bottom: 6px; padding-left: 12px; position: relative;">
                            <span style="position: absolute; left: 0; color: var(--protest-pink);">■</span>
                            <strong>Remaining pupils (Eligible for Group Transport):</strong> ${zoneCohortPop.toFixed(4)} - ${isolatedPupils.toFixed(4)} = ${remPupils.toFixed(4)} pupils per zone.
                        </li>
                        <li style="margin-bottom: 6px; padding-left: 12px; position: relative;">
                            <span style="position: absolute; left: 0; color: var(--protest-pink);">■</span>
                            <strong>Group Vehicle Selection:</strong><br>
                            <span style="color: var(--text-primary); font-family: monospace; display: block; margin-top: 4px; padding-left: 10px; border-left: 2px solid var(--border-color);">${groupMathText}</span>
                        </li>
                        <li style="margin-top: 10px; margin-bottom: 6px; padding-left: 12px; position: relative;">
                            <span style="position: absolute; left: 0; color: var(--protest-blue);">■</span>
                            <strong>Total Vehicles per Zone:</strong> ${isolatedTaxis.toFixed(4)} isolated taxis + ${groupTaxis.toFixed(4)} group taxis + ${groupMinibuses.toFixed(4)} group minibuses + ${groupCoaches.toFixed(4)} group coaches = <strong>${(taxisPerZone + minibusesPerZone + coachesPerZone).toFixed(4)} vehicles per zone</strong>.
                        </li>
                    </ul>
                    <div class="formula-box">
                        Daily Cost per Zone = (Taxis per Zone &times; Taxi Cost/Day) + (Minibuses per Zone &times; Minibus Cost/Day) + (Coaches per Zone &times; Coach Cost/Day)<br>
                        Daily Cost per Zone = (${taxisPerZone.toFixed(4)} &times; £${vehicleCostPerDay}) + (${minibusesPerZone.toFixed(4)} &times; £${minibusCostPerDay}) + (${coachesPerZone.toFixed(4)} &times; £${coachCostPerDay}) = ${formatGBP(zoneCostPerDay)} per zone/day
                    </div>
                    <div class="formula-box">
                        Total Daily Cost (All Zones) = Daily Cost per Zone &times; Number of Zones<br>
                        Total Daily Cost = ${formatGBP(zoneCostPerDay)} &times; ${numberOfZones} = ${formatGBP(totalDailyCost)} per day
                    </div>
                    <div class="formula-box">
                        Annual Transport Cost = Total Daily Cost &times; School Days/Year<br>
                        Annual Transport Cost = ${formatGBP(totalDailyCost)} &times; ${schoolDays} = ${formatGBP(annualVehicleCost)}
                    </div>
                </div>

                <!-- Step 3: Appeals -->
                <div class="trace-step">
                    <h3>4. Dispute Resolution / Appeals Progression Pipeline (Year 1 Intake)</h3>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);">
                        Cutting transport eligibility triggers a structured appellate pipeline. Unit costs are applied to children entering the system each year.
                    </p>
                    <ul style="list-style-type: none; padding-left: 0; font-size: 0.85rem;">
                        <li style="margin-bottom: 6px; padding-left: 12px; position: relative;">
                            <span style="position: absolute; left: 0; color: var(--protest-pink);">■</span>
                            <strong>Stage 1 (Internal Review):</strong> ${actualAffected.toFixed(2)} intake pupils &times; ${(s1AppealsRate * 100).toFixed(0)}% = ${s1Count.toFixed(2)} appeals.<br>
                            Cost: ${s1Count.toFixed(2)} appeals &times; ${formatGBP(s1Cost)} unit cost = <strong>${formatGBP(costS1)}</strong>.
                        </li>
                        <li style="margin-bottom: 6px; padding-left: 12px; position: relative;">
                            <span style="position: absolute; left: 0; color: var(--protest-pink);">■</span>
                            <strong>Stage 2 (Independent Panel Hearing):</strong> ${s1Count.toFixed(2)} Stage 1 appeals &times; ${(s2AppealsRate * 100).toFixed(0)}% escalation = ${s2Count.toFixed(2)} panels.<br>
                            Cost: ${s2Count.toFixed(2)} hearings &times; ${formatGBP(s2Cost)} unit cost = <strong>${formatGBP(costS2)}</strong>.
                        </li>
                        <li style="margin-bottom: 6px; padding-left: 12px; position: relative;">
                            <span style="position: absolute; left: 0; color: var(--protest-pink);">■</span>
                            <strong>Stage 3 (Ombudsman Review):</strong> ${s2Count.toFixed(2)} Stage 2 panels &times; ${(s3OmbudRate * 100).toFixed(0)}% escalation = ${s3Count.toFixed(2)} investigations.<br>
                            Cost: ${s3Count.toFixed(2)} cases &times; ${formatGBP(s3Cost)} unit cost = <strong>${formatGBP(costS3)}</strong>.
                        </li>
                    </ul>
                    <div class="formula-box">
                        Total Annual Appeal Cost = Stage 1 Cost + Stage 2 Cost + Stage 3 Cost<br>
                        Total Annual Appeal Cost = ${formatGBP(costS1)} + ${formatGBP(costS2)} + ${formatGBP(costS3)} = ${formatGBP(totalAppealsCost)}
                    </div>
                </div>

                <!-- Step 4: Year 1 Summary -->
                <div class="trace-step">
                    <h3>5. Year 1 Final Fiscal Summary</h3>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);">
                        Sums all operational, dispute, and general admin costs for the first implementation year, contrasting it with the Council's phased savings target (19.72% weight).
                    </p>
                    <div class="formula-box">
                        Total Year 1 Actual Cost = Transport (${formatGBP(annualVehicleCost)}) + Appeals (${formatGBP(totalAppealsCost)}) + Admin (${formatGBP(ongoingAdminCost)}) = ${formatGBP(totalCostY1)}
                    </div>
                    <div class="formula-box">
                        Phased Savings Target = Target Savings (${formatGBP(councilSavingsClaim)}) &times; Year 1 Weight (19.72%) = ${formatGBP(phasedSavingsY1)}
                    </div>
                    
                    <div class="trace-highlight-box ${netY1 >= 0 ? 'success' : ''}">
                        <strong>Year 1 Net Balance:</strong> ${formatGBP(phasedSavingsY1)} (Savings) - ${formatGBP(totalCostY1)} (Cost) = <strong style="text-decoration: underline;">${formatGBP(netY1)}</strong><br>
                        <span style="font-size: 0.8rem; margin-top: 5px; display: block;">
                            ${netY1 < 0 
                                ? `🚨 Deficit: Costs exceed claimed savings by <strong>${formatGBP(Math.abs(netY1))}</strong> in the first year.` 
                                : `✅ Surplus: Policy yields a net gain of <strong>${formatGBP(netY1)}</strong> in the first year.`
                            }
                        </span>
                    </div>
                </div>

                <!-- Step 5: Cohort Accumulation & 8-Year Progression -->
                <div class="trace-step">
                    <h3>6. Cohort Accumulation &amp; 8-Year Totals</h3>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 10px;">
                        The model stack builds up for 5 years (representing pupils' 5-year school careers). From Year 5 onwards, the school corridors reach steady-state density, and vehicles are consolidated dynamically.
                    </p>
                    <div class="table-wrapper">
                        <table class="trace-table-summary">
                            <thead>
                                <tr>
                                    <th>Year</th>
                                    <th>Cohorts</th>
                                    <th>Vehicle Cost</th>
                                    <th>Appeals</th>
                                    <th>Admin</th>
                                    <th>Total Cost</th>
                                    <th>Claimed Savings</th>
                                    <th>Net Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${yearsTraceData.map(y => `
                                    <tr style="${y.year === 8 ? 'background-color: rgba(255, 42, 133, 0.08); font-weight: bold;' : ''}">
                                        <td>Year ${y.year}</td>
                                        <td>${y.activeCohorts}</td>
                                        <td>${formatGBP(y.spotVehicle)}</td>
                                        <td>${formatGBP(y.spotAppeals)}</td>
                                        <td>${formatGBP(y.spotAdmin)}</td>
                                        <td>${formatGBP(y.spotTotal)}</td>
                                        <td>${formatGBP(y.spotSavings)}</td>
                                        <td class="${y.spotNet < 0 ? 'deficit-text' : 'savings-text'}">${formatGBP(y.spotNet)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div style="margin-top: 20px;">
                        <h3>8-Year Cumulative Sums:</h3>
                        <div style="font-size: 0.85rem; padding: 12px; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); border-radius: 4px; line-height: 1.6;">
                            <div>• <strong>Cumulative Transport Cost (8 Yrs):</strong> ${formatGBP(finalYear.cumulativeVehicle)}</div>
                            <div>• <strong>Cumulative Appeals Cost (8 Yrs):</strong> ${formatGBP(finalYear.cumulativeAppeals)}</div>
                            <div>• <strong>Cumulative Admin Cost (8 Yrs):</strong> ${formatGBP(finalYear.cumulativeAdmin)}</div>
                            <div style="border-bottom: 1px dashed rgba(255,255,255,0.1); margin: 6px 0;"></div>
                            <div>• <strong>Total STAG Projected Cost:</strong> ${formatGBP(finalYear.cumulativeVehicle)} + ${formatGBP(finalYear.cumulativeAppeals)} + ${formatGBP(finalYear.cumulativeAdmin)} = <strong>${formatGBP(finalYear.cumulativeTotal)}</strong></div>
                            <div>• <strong>Total Council Claimed Savings:</strong> <strong>${formatGBP(finalYear.cumulativeSavings)}</strong></div>
                        </div>
                    </div>

                    <div class="trace-highlight-box ${finalYear.cumulativeNet >= 0 ? 'success' : ''}" style="margin-top: 15px;">
                        <strong>8-Year Net Cumulative Balance:</strong> ${formatGBP(finalYear.cumulativeSavings)} (Savings) - ${formatGBP(finalYear.cumulativeTotal)} (Costs) = <strong style="text-decoration: underline; font-size: 1.1rem;">${formatGBP(finalYear.cumulativeNet)}</strong><br>
                        <span style="font-size: 0.85rem; margin-top: 5px; display: block;">
                            ${finalYear.cumulativeNet < 0 
                                ? `🚨 Fiscal Verdict: The policy is a NET LOSER over 8 years, draining NYC accounts by <strong>${formatGBP(Math.abs(finalYear.cumulativeNet))}</strong>.` 
                                : `✅ Fiscal Verdict: The policy is a NET GAINER over 8 years, yielding <strong>${formatGBP(finalYear.cumulativeNet)}</strong>.`
                            }
                        </span>
                    </div>
                </div>
            `;
        }

        // Generate Plain Text version for copy-paste
        plainTextTrace = 
`================================================================================
                           CALCULATION AUDIT TRACE
================================================================================
Generated: ${new Date().toLocaleString('en-GB')}
This audit trail shows exactly how the current input parameters calculate the 
final financial results. Zero hidden variables.

--------------------------------------------------------------------------------
1. ACTIVE MODEL PARAMETERS
--------------------------------------------------------------------------------
- Children Affected: ${childrenAffected.toLocaleString()}
- Opt-Out Rate: ${(optOutRate * 100).toFixed(0)}%
- Actual Affected: ${actualAffected.toFixed(2)}
- Feeder Zones / Clusters: ${numberOfZones}
- Isolation Rate: ${(isolationRate * 100).toFixed(0)}%
- Taxi Cost/Day: ${formatGBP(vehicleCostPerDay)} (capacity: ${pupilsPerAltVehicle})
- Minibus Cost/Day: ${formatGBP(minibusCostPerDay)} (capacity: ${pupilsPerMinibus})
- Minibus Threshold: ${minibusThreshold}
- Coach Cost/Day: ${formatGBP(coachCostPerDay)} (capacity: ${pupilsPerCoach})
- Coach Threshold: ${coachThreshold}
- Stage 1 Appeal Cost: ${formatGBP(s1Cost)} (rate: ${(s1AppealsRate * 100).toFixed(0)}%)
- Stage 2 Appeal Cost: ${formatGBP(s2Cost)} (rate: ${(s2AppealsRate * 100).toFixed(0)}%)
- Stage 3 Appeal Cost: ${formatGBP(s3Cost)} (rate: ${(s3OmbudRate * 100).toFixed(0)}%)
- Annual Admin Cost: ${formatGBP(ongoingAdminCost)}
- Council Savings Claim: ${formatGBP(councilSavingsClaim)}
- School Days / Year: ${schoolDays}

--------------------------------------------------------------------------------
2. NET CHILDREN REQUIRING TRANSPORT
--------------------------------------------------------------------------------
Formula:
  Actual Affected Pupils = Children Affected * (100% - Opt-Out Rate)
Calculation:
  ${childrenAffected.toLocaleString()} * (100% - ${(optOutRate * 100).toFixed(0)}%) = ${actualAffected.toFixed(2)} pupils

--------------------------------------------------------------------------------
3. ROUTE FRACTURING & VEHICLE ALLOCATIONS (YEAR 1)
--------------------------------------------------------------------------------
- Pupils per Zone: ${actualAffected.toFixed(2)} / ${numberOfZones} = ${zoneCohortPop.toFixed(4)} pupils/zone
- Isolated pupils/zone (Taxi-reliant): ${zoneCohortPop.toFixed(4)} * ${(isolationRate * 100).toFixed(0)}% = ${isolatedPupils.toFixed(4)} pupils/zone
- Isolated Taxis required/zone: ${isolatedPupils.toFixed(4)} / ${pupilsPerAltVehicle} = ${isolatedTaxis.toFixed(4)} Taxis/zone
- Remaining pupils/zone: ${zoneCohortPop.toFixed(4)} - ${isolatedPupils.toFixed(4)} = ${remPupils.toFixed(4)} pupils/zone
- Group Vehicle Selection:
  ${groupMathText.replace(/<br>/g, '\n  ')}
- Total Vehicles/Zone:
  - Taxis: ${taxisPerZone.toFixed(4)}
  - Minibuses: ${minibusesPerZone.toFixed(4)}
  - Coaches: ${coachesPerZone.toFixed(4)}
  - Total: ${(taxisPerZone + minibusesPerZone + coachesPerZone).toFixed(4)} vehicles/zone

Formulas:
  Daily Cost per Zone = (${taxisPerZone.toFixed(4)} Taxis * £${vehicleCostPerDay}) + (${minibusesPerZone.toFixed(4)} Minibuses * £${minibusCostPerDay}) + (${coachesPerZone.toFixed(4)} Coaches * £${coachCostPerDay}) = ${formatGBP(zoneCostPerDay)}
  Total Daily Cost (All Zones) = ${formatGBP(zoneCostPerDay)} * ${numberOfZones} zones = ${formatGBP(totalDailyCost)} per day
  Annual Transport Cost = ${formatGBP(totalDailyCost)} * ${schoolDays} days = ${formatGBP(annualVehicleCost)}

--------------------------------------------------------------------------------
4. DISPUTE RESOLUTION / APPEALS PROGRESSION (YEAR 1 INTAKE)
--------------------------------------------------------------------------------
- Stage 1: ${actualAffected.toFixed(2)} pupils * ${(s1AppealsRate * 100).toFixed(0)}% = ${s1Count.toFixed(2)} reviews. Cost: ${s1Count.toFixed(2)} * ${formatGBP(s1Cost)} = ${formatGBP(costS1)}
- Stage 2: ${s1Count.toFixed(2)} Stage 1 * ${(s2AppealsRate * 100).toFixed(0)}% = ${s2Count.toFixed(2)} panels. Cost: ${s2Count.toFixed(2)} * ${formatGBP(s2Cost)} = ${formatGBP(costS2)}
- Stage 3: ${s2Count.toFixed(2)} Stage 2 * ${(s3OmbudRate * 100).toFixed(0)}% = ${s3Count.toFixed(2)} LGSCO cases. Cost: ${s3Count.toFixed(2)} * ${formatGBP(s3Cost)} = ${formatGBP(costS3)}

Formula:
  Total Year 1 Appeal Cost = Stage 1 (${formatGBP(costS1)}) + Stage 2 (${formatGBP(costS2)}) + Stage 3 (${formatGBP(costS3)}) = ${formatGBP(totalAppealsCost)}

--------------------------------------------------------------------------------
5. YEAR 1 FINAL FISCAL SUMMARY
--------------------------------------------------------------------------------
- Annual Transport Cost: ${formatGBP(annualVehicleCost)}
- Annual Appeals Cost: ${formatGBP(totalAppealsCost)}
- General Administration Cost: ${formatGBP(ongoingAdminCost)}
- Total Year 1 Cost: ${formatGBP(totalCostY1)}
- Council Phased Savings: ${formatGBP(phasedSavingsY1)} (19.72% of Year 8 Claim)

Net Year 1 Balance:
  Savings (${formatGBP(phasedSavingsY1)}) - Costs (${formatGBP(totalCostY1)}) = ${formatGBP(netY1)}
  (${netY1 < 0 ? 'Deficit' : 'Surplus'})

--------------------------------------------------------------------------------
6. COHORT PROGRESSION TABLE & 8-YEAR TOTALS
--------------------------------------------------------------------------------
Year     Cohorts   Vehicle Cost    Appeals        Admin       Total Cost    Claimed Savings   Net Balance
--------------------------------------------------------------------------------
${yearsTraceData.map(y => 
`Year ${y.year}    ${y.activeCohorts}        ${formatGBP(y.spotVehicle).padEnd(14)}  ${formatGBP(y.spotAppeals).padEnd(12)}  ${formatGBP(y.spotAdmin).padEnd(10)}  ${formatGBP(y.spotTotal).padEnd(12)}  ${formatGBP(y.spotSavings).padEnd(16)}  ${formatGBP(y.spotNet)}`
).join('\n')}
--------------------------------------------------------------------------------

8-Year Cumulative Sums:
- Cumulative Transport Cost: ${formatGBP(finalYear.cumulativeVehicle)}
- Cumulative Appeals Cost: ${formatGBP(finalYear.cumulativeAppeals)}
- Cumulative Admin Cost: ${formatGBP(finalYear.cumulativeAdmin)}
- Total STAG Projected Cost: ${formatGBP(finalYear.cumulativeTotal)}
- Total Council Claimed Savings: ${formatGBP(finalYear.cumulativeSavings)}

8-Year Net Cumulative Balance:
  Total Savings (${formatGBP(finalYear.cumulativeSavings)}) - Total Costs (${formatGBP(finalYear.cumulativeTotal)}) = ${formatGBP(finalYear.cumulativeNet)}
  Verdict: ${finalYear.cumulativeNet < 0 ? 'BAD POLICY DECISION (Costs Exceed Savings)' : 'GOOD POLICY DECISION (Savings Exceed Costs)'}
================================================================================
`;
    }

    // -------------------------------------------------------------
    // Initial Load
    // -------------------------------------------------------------
    // Set initial text values matching the slider defaults
    Object.keys(inputs).forEach(key => {
        const unit = inputs[key].dataset.unit || '';
        let valText = inputs[key].value;
        if (key === 'councilSavingsClaim') {
            valText = formatGBP(valText);
        } else if (key === 'vehicleCostPerDay' || key === 'minibusCostPerDay' || key === 'coachCostPerDay' || key === 'ongoingAdminCost' || key === 's1Cost' || key === 's2Cost' || key === 's3Cost') {
            valText = '£' + parseFloat(valText).toLocaleString('en-GB');
        } else if (key === 'vehicleCapacity' || key === 'minibusCapacity' || key === 'coachCapacity' || key === 'numberOfZones' || key === 'minibusThreshold' || key === 'coachThreshold') {
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

    const modalTrace = document.getElementById('modal-trace');
    const btnRunTrace = document.getElementById('btn-run-trace');
    const closeBtnTrace = document.getElementById('modal-trace-close-btn');
    const btnCopyTrace = document.getElementById('btn-copy-trace');

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

    if (btnRunTrace && modalTrace && closeBtnTrace) {
        btnRunTrace.addEventListener('click', () => {
            updateTraceModalContent();
            modalTrace.style.display = 'flex';
        });

        closeBtnTrace.addEventListener('click', () => {
            modalTrace.style.display = 'none';
        });
    }

    if (btnCopyTrace) {
        btnCopyTrace.addEventListener('click', () => {
            navigator.clipboard.writeText(plainTextTrace).then(() => {
                const originalText = btnCopyTrace.textContent;
                btnCopyTrace.textContent = "Copied!";
                btnCopyTrace.style.backgroundColor = "var(--protest-green)";
                btnCopyTrace.style.color = "#000000";
                setTimeout(() => {
                    btnCopyTrace.textContent = originalText;
                    btnCopyTrace.style.backgroundColor = "";
                    btnCopyTrace.style.color = "";
                }, 2000);
            }).catch(err => {
                console.error("Failed to copy text: ", err);
                alert("Could not copy trace to clipboard. Please copy it manually.");
            });
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
        if (e.target === modalTrace) {
            modalTrace.style.display = 'none';
        }
    });

    // Initialize sidebar accordions with explicit style display toggles for cross-browser safety
    const controlGroups = document.querySelectorAll('.control-group');
    controlGroups.forEach(group => {
        const header = group.querySelector('.control-group-header');
        const content = group.querySelector('.control-group-content');
        if (header && content) {
            // Set initial state to collapsed explicitly to ensure it works even if stylesheet is cached
            content.style.display = 'none';
            group.classList.remove('open');
            
            header.addEventListener('click', () => {
                const isOpen = group.classList.toggle('open');
                content.style.display = isOpen ? 'block' : 'none';
            });
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
