function runDashboard() {
    // -------------------------------------------------------------
    // Baseline constants and default parameters (Final Spreadsheet Spec)
    // -------------------------------------------------------------
    const defaults = {
        childrenAffected: 340,
        optOutRate: 0.70,     // 70%
        erosionRate: 0.10,    // 10%
        observationWindow: 7, // 7 years
        taxiCostPerDay: 125,
        pupilsPerTaxi: 3,
        schoolDays: 190,
        schoolCareer: 5,
        s1AppealsRate: 0.45,  // 45% of actual affected children
        s2AppealsRate: 0.50,  // 50% of Stage 1
        s3OmbudRate: 0.20,    // 20% of Stage 2
        s1Cost: 150,
        s2Cost: 750,
        s3Cost: 1400,
        ongoingAdminCost: 20000,
        councilSavingsClaim: 3000000 // Cumulative over 7 years
    };

    // -------------------------------------------------------------
    // UI Elements
    // -------------------------------------------------------------
    const inputs = {
        childrenAffected: document.getElementById('input-children-affected'),
        optOutRate: document.getElementById('input-opt-out-rate'),
        erosionRate: document.getElementById('input-erosion-rate'),
        taxiCostPerDay: document.getElementById('input-taxi-cost'),
        s1AppealsRate: document.getElementById('input-appeals-rate-s1'),
        s2AppealsRate: document.getElementById('input-appeals-rate-s2'),
        s3OmbudRate: document.getElementById('input-appeals-rate-s3'),
        s1Cost: document.getElementById('input-appeals-cost-s1'),
        s2Cost: document.getElementById('input-appeals-cost-s2'),
        s3Cost: document.getElementById('input-appeals-cost-s3'),
        ongoingAdminCost: document.getElementById('input-admin-cost'),
        councilSavingsClaim: document.getElementById('input-council-savings')
    };

    const values = {
        childrenAffected: document.getElementById('val-children-affected'),
        optOutRate: document.getElementById('val-opt-out-rate'),
        erosionRate: document.getElementById('val-erosion-rate'),
        taxiCostPerDay: document.getElementById('val-taxi-cost'),
        s1AppealsRate: document.getElementById('val-appeals-rate-s1'),
        s2AppealsRate: document.getElementById('val-appeals-rate-s2'),
        s3OmbudRate: document.getElementById('val-appeals-rate-s3'),
        s1Cost: document.getElementById('val-appeals-cost-s1'),
        s2Cost: document.getElementById('val-appeals-cost-s2'),
        s3Cost: document.getElementById('val-appeals-cost-s3'),
        ongoingAdminCost: document.getElementById('val-admin-cost'),
        councilSavingsClaim: document.getElementById('val-council-savings')
    };

    // Calculated read-only values in control panel
    const derivedDisplays = {
        actualAffected: document.getElementById('val-actual-affected'),
        taxisRequired: document.getElementById('val-taxis-required')
    };

    const kpis = {
        netSavings: document.getElementById('kpi-net-savings'),
        netSavingsLabel: document.getElementById('kpi-net-savings-label'),
        netSubtext: document.getElementById('kpi-net-subtext'),
        netStatusBadge: document.getElementById('kpi-net-status-badge'),
        compoundedTaxiCost: document.getElementById('kpi-compounded-taxi'),
        disputeCost: document.getElementById('kpi-dispute-cost'),
        adminCost: document.getElementById('kpi-admin-cost'),
        costCoverage: document.getElementById('kpi-cost-coverage'),
        costCoverageLabel: document.getElementById('kpi-cost-coverage-label'),
        costCoverageSubtext: document.getElementById('kpi-cost-coverage-subtext'),
        cardNetBalance: document.getElementById('card-net-balance'),
        cardCostCoverage: document.getElementById('card-cost-coverage')
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
        const taxiCostPerDay = parseFloat(inputs.taxiCostPerDay.value);
        const s1AppealsRate = parseFloat(inputs.s1AppealsRate.value) / 100;
        const s2AppealsRate = parseFloat(inputs.s2AppealsRate.value) / 100;
        const s3OmbudRate = parseFloat(inputs.s3OmbudRate.value) / 100;
        const ongoingAdminCost = parseFloat(inputs.ongoingAdminCost.value);
        const councilSavingsClaim = parseFloat(inputs.councilSavingsClaim.value);

        // Fixed defaults for inner operations (to preserve simplicity in sidebar)
        const pupilsPerTaxi = defaults.pupilsPerTaxi;
        const schoolDays = defaults.schoolDays;
        const schoolCareer = defaults.schoolCareer;
        
        // Read appeals unit costs dynamically from inputs
        const s1Cost = parseFloat(inputs.s1Cost.value);
        const s2Cost = parseFloat(inputs.s2Cost.value);
        const s3Cost = parseFloat(inputs.s3Cost.value);

        // Derived variables
        const actualAffected = Math.round(childrenAffected * (1 - optOutRate) * 100) / 100;
        const baseCohortTaxis = actualAffected / pupilsPerTaxi;
        const annualTaxiCost = baseCohortTaxis * taxiCostPerDay * schoolDays;

        // Peak annual savings S in Year 7: 4 * S = claim => S = claim / 4
        const peakSavingsY7 = councilSavingsClaim / 4;

        let cumulativeTaxi = 0;
        let cumulativeAppealsTotal = 0;
        let cumulativeAdmin = 0;
        let cumulativeCouncilSavings = 0;
        let cumulativeTotal = 0;

        const yearsData = [];

        for (let t = 1; t <= 7; t++) {
            // Taxis Spot Cost: Sum of active cohorts in system (eroded based on their career age)
            let spotTaxi = 0;
            for (let age = 1; age <= Math.min(t, schoolCareer); age++) {
                const cohortTaxis = baseCohortTaxis * Math.pow(1 - erosionRate, age - 1);
                spotTaxi += cohortTaxis * taxiCostPerDay * schoolDays;
            }
            cumulativeTaxi += spotTaxi;

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

            // Claimed Savings (Phased in linearly: Savings(t) = peak * t / 7)
            const spotCouncilSavings = peakSavingsY7 * (t / 7);
            cumulativeCouncilSavings += spotCouncilSavings;

            const spotTotal = spotTaxi + spotAppeals + spotAdmin;
            const cumulativeTotal = cumulativeTaxi + cumulativeAppealsTotal + cumulativeAdmin;

            const spotNetSavings = spotCouncilSavings - spotTotal;
            const cumulativeNetSavings = cumulativeCouncilSavings - cumulativeTotal;

            yearsData.push({
                year: t,
                spotTaxi,
                cumulativeTaxi,
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
            baseCohortTaxis,
            annualTaxiCost,
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
        const finalYear = model.yearsData[6]; // Year 7

        // Update read-only derived stats in control panel
        derivedDisplays.actualAffected.textContent = Math.round(model.actualAffected);
        derivedDisplays.taxisRequired.textContent = (model.baseCohortTaxis).toFixed(1);

        // Update KPI panels
        const cumulative7YearSavings = finalYear.cumulativeNetSavings;
        kpis.netSavings.textContent = formatGBP(cumulative7YearSavings);
        
        if (cumulative7YearSavings < 0) {
            kpis.netSavings.className = 'metric-value deficit-text';
            kpis.netSavingsLabel.textContent = '7-Year Net Cumulative Balance';
            kpis.netSubtext.textContent = 'True fiscal outcome after costs are deducted';
            
            // Status Badge
            kpis.netStatusBadge.className = 'metric-status-badge status-deficit';
            kpis.netStatusBadge.textContent = '🚨 COSTS EXCEED SAVINGS';
            
            // Card outline
            kpis.cardNetBalance.className = 'metric-card deficit-alert';
        } else {
            kpis.netSavings.className = 'metric-value savings-text';
            kpis.netSavingsLabel.textContent = '7-Year Net Cumulative Balance';
            kpis.netSubtext.textContent = 'True fiscal outcome after costs are deducted';
            
            // Status Badge
            kpis.netStatusBadge.className = 'metric-status-badge status-savings';
            kpis.netStatusBadge.textContent = '✅ SAVINGS EXCEED COSTS';
            
            // Card outline
            kpis.cardNetBalance.className = 'metric-card savings-alert';
        }

        kpis.compoundedTaxiCost.textContent = formatGBP(finalYear.cumulativeTaxi);
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
            if (yr.year === 7) {
                tr.className = 'highlight-row';
            }

            const activeTaxi = activeViewMode === 'cumulative' ? yr.cumulativeTaxi : yr.spotTaxi;
            const activeAppeals = activeViewMode === 'cumulative' ? yr.cumulativeAppeals : yr.spotAppeals;
            const activeAdmin = activeViewMode === 'cumulative' ? yr.cumulativeAdmin : yr.spotAdmin;
            const activeTotal = activeViewMode === 'cumulative' ? yr.cumulativeTotal : yr.spotTotal;
            const activeClaimed = activeViewMode === 'cumulative' ? yr.cumulativeCouncilSavings : yr.spotCouncilSavings;
            const activeNet = activeViewMode === 'cumulative' ? yr.cumulativeNetSavings : yr.spotNetSavings;

            tr.innerHTML = `
                <td>Year ${yr.year}</td>
                <td>${formatGBP(activeTaxi)}</td>
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
        const annualTaxiPerPupil = (defaults.schoolDays * parseFloat(inputs.taxiCostPerDay.value)) / defaults.pupilsPerTaxi;
        tables.transportComparison.innerHTML = `
            <tr>
                <td>Legacy Coach Pass (Bulk Rate)</td>
                <td>50 Pupils</td>
                <td>£42,500</td>
                <td>£850</td>
            </tr>
            <tr class="highlight-row">
                <td>Bespoke Taxi / Minibus</td>
                <td>3 Pupils (Rural Inefficient)</td>
                <td>${formatGBP(parseFloat(inputs.taxiCostPerDay.value) * defaults.schoolDays)}</td>
                <td>${formatGBP(annualTaxiPerPupil)}</td>
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

        // Update Chart.js Data
        renderChart(model.yearsData);
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

            const labels = yearsData.map(y => `Year ${y.year}`);
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
                                label: 'STAG Projected Cost (Taxis+Appeals+Admin)',
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

        const labels = yearsData.map(y => `Year ${y.year}`);
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
            return margin.left + index * (graphWidth / 6);
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
        for (let i = 0; i < 7; i++) {
            const xPos = getX(i);
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', xPos);
            text.setAttribute('y', height - margin.bottom + 20);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#aaaaaa');
            text.setAttribute('font-size', '10px');
            text.setAttribute('font-family', 'Inter');
            text.textContent = `Year ${i+1}`;
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
        const areaData = getPathData(dataNet) + ` L ${getX(6)} ${getY(minVal)} L ${getX(0)} ${getY(minVal)} Z`;
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
            } else if (key === 'taxiCostPerDay' || key === 'ongoingAdminCost' || key === 's1Cost' || key === 's2Cost' || key === 's3Cost') {
                valText = '£' + parseFloat(valText).toLocaleString('en-GB');
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
        inputs.taxiCostPerDay.value = defaults.taxiCostPerDay;
        inputs.s1AppealsRate.value = defaults.s1AppealsRate * 100;
        inputs.s2AppealsRate.value = defaults.s2AppealsRate * 100;
        inputs.s3OmbudRate.value = defaults.s3OmbudRate * 100;
        inputs.s1Cost.value = defaults.s1Cost;
        inputs.s2Cost.value = defaults.s2Cost;
        inputs.s3Cost.value = defaults.s3Cost;
        inputs.ongoingAdminCost.value = defaults.ongoingAdminCost;
        inputs.councilSavingsClaim.value = defaults.councilSavingsClaim;

        // Reset numeric value texts
        Object.keys(inputs).forEach(key => {
            const unit = inputs[key].dataset.unit || '';
            let valText = inputs[key].value;
            if (key === 'councilSavingsClaim') {
                valText = formatGBP(valText);
            } else if (key === 'taxiCostPerDay' || key === 'ongoingAdminCost' || key === 's1Cost' || key === 's2Cost' || key === 's3Cost') {
                valText = '£' + parseFloat(valText).toLocaleString('en-GB');
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
        } else if (key === 'taxiCostPerDay' || key === 'ongoingAdminCost' || key === 's1Cost' || key === 's2Cost' || key === 's3Cost') {
            valText = '£' + parseFloat(valText).toLocaleString('en-GB');
        }
        values[key].textContent = `${valText}${unit}`;
    });
    
    // Modal controls for "How this model works"
    const modal = document.getElementById('modal-info');
    const btnHowItWorks = document.getElementById('btn-how-it-works');
    const closeBtn = document.getElementById('modal-close-btn');

    if (btnHowItWorks && modal && closeBtn) {
        btnHowItWorks.addEventListener('click', () => {
            modal.style.display = 'flex';
        });

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Close when clicking outside content box
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Initial render
    updateUI();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runDashboard);
} else {
    runDashboard();
}
