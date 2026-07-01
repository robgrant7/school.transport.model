document.addEventListener('DOMContentLoaded', () => {
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
        compoundedTaxiCost: document.getElementById('kpi-compounded-taxi'),
        disputeCost: document.getElementById('kpi-dispute-cost'),
        adminCost: document.getElementById('kpi-admin-cost'),
        costCoverage: document.getElementById('kpi-cost-coverage'),
        costCoverageLabel: document.getElementById('kpi-cost-coverage-label')
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
        const s1Cost = defaults.s1Cost;
        const s2Cost = defaults.s2Cost;
        const s3Cost = defaults.s3Cost;

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
            kpis.netSavingsLabel.textContent = '7-Year Net Cumulative Balance (Deficit)';
        } else {
            kpis.netSavings.className = 'metric-value savings-text';
            kpis.netSavingsLabel.textContent = '7-Year Net Cumulative Balance (Savings)';
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
        } else if (pctEaten >= 50) {
            kpis.costCoverage.className = 'metric-value yellow-text';
            kpis.costCoverageLabel.textContent = 'Savings Severely Eroded';
        } else {
            kpis.costCoverage.className = 'metric-value blue-text';
            kpis.costCoverageLabel.textContent = 'Savings Marginal Loss';
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
    }

    // -------------------------------------------------------------
    // Event Listeners & Interactions
    // -------------------------------------------------------------
    // Live slider values updates and calculation triggers
    Object.keys(inputs).forEach(key => {
        inputs[key].addEventListener('input', (e) => {
            const unit = e.target.dataset.unit || '';
            let valText = e.target.value;
            
            // Format displays
            if (key === 'councilSavingsClaim') {
                valText = formatGBP(valText);
            } else if (key === 'taxiCostPerDay' || key === 'ongoingAdminCost') {
                valText = '£' + parseFloat(valText).toLocaleString('en-GB');
            }
            
            values[key].textContent = `${valText}${unit}`;
            updateUI();
        });
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
        inputs.ongoingAdminCost.value = defaults.ongoingAdminCost;
        inputs.councilSavingsClaim.value = defaults.councilSavingsClaim;

        // Reset numeric value texts
        Object.keys(inputs).forEach(key => {
            const unit = inputs[key].dataset.unit || '';
            let valText = inputs[key].value;
            if (key === 'councilSavingsClaim') {
                valText = formatGBP(valText);
            } else if (key === 'taxiCostPerDay' || key === 'ongoingAdminCost') {
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
        } else if (key === 'taxiCostPerDay' || key === 'ongoingAdminCost') {
            valText = '£' + parseFloat(valText).toLocaleString('en-GB');
        }
        values[key].textContent = `${valText}${unit}`;
    });
    
    // Initial render
    updateUI();
});
