document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // Baseline constants and default parameters (Revised)
    // -------------------------------------------------------------
    const defaults = {
        affectedPupilsPerYear: 340,
        pctBespokeTaxis: 0.015, // 1.5%
        taxiCostPerDay: 150,
        pupilsPerTaxi: 3,
        schoolDays: 190,
        schoolCareer: 5,
        s1AppealsRate: 0.167, // 16.7% of affected pupils
        s2AppealsRate: 0.450, // 45% of Stage 1
        s3OmbudRate: 0.333,   // 33.3% of Stage 2
        appealsDecay: 0.25,   // 25%
        s1Salary: 40,
        s1Hours: 4,
        s2ClerkSalary: 40,
        s2ClerkHours: 8,
        s2OfficerSalary: 50,
        s2OfficerHours: 5,
        s2TravelCost: 186,
        ombudInfoGovSalary: 130,
        ombudInfoGovHours: 7,
        ombudLegalSalary: 85,
        ombudLegalHours: 4,
        ombudCeoSalary: 90,
        ombudCeoHours: 2,
        ongoingAdminCost: 20000,
        councilSavingsY7: 3000000
    };

    // -------------------------------------------------------------
    // UI Elements
    // -------------------------------------------------------------
    const inputs = {
        affectedPupilsPerYear: document.getElementById('input-affected-pupils'),
        pctBespokeTaxis: document.getElementById('input-pct-taxis'),
        taxiCostPerDay: document.getElementById('input-taxi-cost'),
        s1AppealsRate: document.getElementById('input-appeals-rate-s1'),
        s2AppealsRate: document.getElementById('input-appeals-rate-s2'),
        s3OmbudRate: document.getElementById('input-appeals-rate-s3'),
        appealsDecay: document.getElementById('input-appeals-decay'),
        ongoingAdminCost: document.getElementById('input-admin-cost'),
        councilSavingsY7: document.getElementById('input-council-savings')
    };

    const values = {
        affectedPupilsPerYear: document.getElementById('val-affected-pupils'),
        pctBespokeTaxis: document.getElementById('val-pct-taxis'),
        taxiCostPerDay: document.getElementById('val-taxi-cost'),
        s1AppealsRate: document.getElementById('val-appeals-rate-s1'),
        s2AppealsRate: document.getElementById('val-appeals-rate-s2'),
        s3OmbudRate: document.getElementById('val-appeals-rate-s3'),
        appealsDecay: document.getElementById('val-appeals-decay'),
        ongoingAdminCost: document.getElementById('val-admin-cost'),
        councilSavingsY7: document.getElementById('val-council-savings')
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
        const affectedPupilsPerYear = parseFloat(inputs.affectedPupilsPerYear.value);
        const pctBespokeTaxis = parseFloat(inputs.pctBespokeTaxis.value) / 100;
        const taxiCostPerDay = parseFloat(inputs.taxiCostPerDay.value);
        const s1AppealsRate = parseFloat(inputs.s1AppealsRate.value) / 100;
        const s2AppealsRate = parseFloat(inputs.s2AppealsRate.value) / 100;
        const s3OmbudRate = parseFloat(inputs.s3OmbudRate.value) / 100;
        const appealsDecay = parseFloat(inputs.appealsDecay.value) / 100;
        const ongoingAdminCost = parseFloat(inputs.ongoingAdminCost.value);
        const councilSavingsY7 = parseFloat(inputs.councilSavingsY7.value);

        // Fixed defaults for inner operations (to preserve simplicity in sidebar)
        const pupilsPerTaxi = defaults.pupilsPerTaxi;
        const schoolDays = defaults.schoolDays;
        const schoolCareer = defaults.schoolCareer;
        const s1Salary = defaults.s1Salary;
        const s1Hours = defaults.s1Hours;
        const s2ClerkSalary = defaults.s2ClerkSalary;
        const s2ClerkHours = defaults.s2ClerkHours;
        const s2OfficerSalary = defaults.s2OfficerSalary;
        const s2OfficerHours = defaults.s2OfficerHours;
        const s2TravelCost = defaults.s2TravelCost;
        const ombudInfoGovSalary = defaults.ombudInfoGovSalary;
        const ombudInfoGovHours = defaults.ombudInfoGovHours;
        const ombudLegalSalary = defaults.ombudLegalSalary;
        const ombudLegalHours = defaults.ombudLegalHours;
        const ombudCeoSalary = defaults.ombudCeoSalary;
        const ombudCeoHours = defaults.ombudCeoHours;

        // Derived variables
        const pupilsRequiringTaxiPerDay = affectedPupilsPerYear * pctBespokeTaxis;
        const taxisRequiredPerDay = pupilsRequiringTaxiPerDay / pupilsPerTaxi;
        const costTaxisPerDay = taxisRequiredPerDay * taxiCostPerDay;
        const annualTaxiCost = costTaxisPerDay * schoolDays;

        const s1CostPerAppeal = s1Salary * s1Hours; 
        const s2CostPerAppeal = s2ClerkSalary * s2ClerkHours + s2OfficerSalary * s2OfficerHours + s2TravelCost; 
        const ombudCostPerAppeal = ombudInfoGovSalary * ombudInfoGovHours + ombudLegalSalary * ombudLegalHours + ombudCeoSalary * ombudCeoHours; 

        let cumulativeTaxi = 0;
        let cumulativeAppealsTotal = 0;
        let cumulativeAdmin = 0;
        let cumulativeCouncilSavings = 0;

        const yearsData = [];

        for (let t = 1; t <= 7; t++) {
            // Taxi Spot Cost (Cohort compounding logic up to schoolCareer limit)
            const spotTaxi = annualTaxiCost * Math.min(t, schoolCareer);
            cumulativeTaxi += spotTaxi;

            // Appeals Count (Stage progression logic)
            const s1Count = (affectedPupilsPerYear * s1AppealsRate) * Math.pow(1 - appealsDecay, t - 1);
            const s2Count = s1Count * s2AppealsRate;
            const s3Count = s2Count * s3OmbudRate;

            // Appeals Spot Cost
            const spotS1Cost = s1Count * s1CostPerAppeal;
            const spotS2Cost = s2Count * s2CostPerAppeal;
            const spotOmbudCost = s3Count * ombudCostPerAppeal;
            const spotAppeals = spotS1Cost + spotS2Cost + spotOmbudCost;
            cumulativeAppealsTotal += spotAppeals;

            // General Admin Cost
            const spotAdmin = ongoingAdminCost;
            cumulativeAdmin += spotAdmin;

            // Claimed Savings (Phased in linearly)
            const spotCouncilSavings = councilSavingsY7 * (t / 7);
            cumulativeCouncilSavings += spotCouncilSavings;

            const spotTotal = spotTaxi + spotAppeals + spotAdmin;
            const cumulativeTotal = cumulativeTaxi + cumulativeAppealsTotal + cumulativeAdmin;

            const spotNetSavings = spotCouncilSavings - spotTotal;
            const cumulativeNetSavings = cumulativeCouncilSavings - cumulativeTotal;

            yearsData.push({
                year: t,
                spotTaxi,
                cumulativeTaxi,
                s1Count: Math.round(s1Count),
                s2Count: Math.round(s2Count),
                s3Count: Math.round(s3Count),
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
            annualTaxiCost,
            s1CostPerAppeal,
            s2CostPerAppeal,
            ombudCostPerAppeal,
            pupilsRequiringTaxiPerDay,
            taxisRequiredPerDay,
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

        // 1. Update KPI panels
        const cumulative7YearSavings = finalYear.cumulativeNetSavings;
        kpis.netSavings.textContent = formatGBP(cumulative7YearSavings);
        
        if (cumulative7YearSavings < 0) {
            kpis.netSavings.className = 'metric-value deficit-text';
            kpis.netSavingsLabel.textContent = '7-Year Net Cumulative Deficit';
        } else {
            kpis.netSavings.className = 'metric-value savings-text';
            kpis.netSavingsLabel.textContent = '7-Year Net Cumulative Savings';
        }

        kpis.compoundedTaxiCost.textContent = formatGBP(finalYear.cumulativeTaxi);
        kpis.disputeCost.textContent = formatGBP(finalYear.cumulativeAppeals);
        kpis.adminCost.textContent = formatGBP(finalYear.cumulativeAdmin);

        // Cost Coverage KPI (% of the savings eaten by costs)
        const totalSavingsClaimed = finalYear.cumulativeCouncilSavings;
        const totalCostsStag = finalYear.cumulativeTotal;
        const pctEaten = (totalCostsStag / totalSavingsClaimed) * 100;
        
        kpis.costCoverage.textContent = `${pctEaten.toFixed(1)}%`;
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

        // 2. Populate main breakdown table
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
                <td>${yr.s1Count} / ${yr.s2Count} / ${yr.s3Count}</td>
                <td>${formatGBP(activeAppeals)}</td>
                <td>${formatGBP(activeAdmin)}</td>
                <td style="font-weight: 700;">${formatGBP(activeTotal)}</td>
                <td>${formatGBP(activeClaimed)}</td>
                <td style="font-weight: 700;" class="${activeNet < 0 ? 'deficit-text' : 'savings-text'}">${formatGBP(activeNet)}</td>
            `;
            tables.annualBreakdown.appendChild(tr);
        });

        // 3. Populate Transport Unit Cost Comparison table
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

        // 4. Populate Appeals / Administrative Costs table
        tables.appealsComparison.innerHTML = `
            <tr>
                <td>Stage 1 (Admin Review)</td>
                <td>Admissions Presenter</td>
                <td>4 hrs @ £40/hr</td>
                <td>${formatGBP(model.s1CostPerAppeal)}</td>
            </tr>
            <tr>
                <td>Stage 2 (Independent Panel)</td>
                <td>Clerk + Officer + Travel</td>
                <td>8h Clerk, 5h Officer, Travel</td>
                <td>${formatGBP(model.s2CostPerAppeal)}</td>
            </tr>
            <tr>
                <td>Stage 3 (Ombudsman Inquiry)</td>
                <td>Info Gov + Legal + CEO</td>
                <td>7h Info, 4h Legal, 2h CEO</td>
                <td>${formatGBP(model.ombudCostPerAppeal)}</td>
            </tr>
        `;

        // 5. Update Chart.js Data
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
                            label: 'Council Claimed Savings (Phased)',
                            data: dataClaimed,
                            borderColor: '#a7f432', // lime green
                            backgroundColor: 'rgba(167, 244, 50, 0.05)',
                            borderWidth: 3,
                            pointBackgroundColor: '#a7f432',
                            tension: 0.15,
                            fill: false
                        },
                        {
                            label: 'STAG Projected Cost (Total)',
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
            
            // Format currency for council savings and taxi costs
            if (key === 'councilSavingsY7') {
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
        inputs.affectedPupilsPerYear.value = defaults.affectedPupilsPerYear;
        inputs.pctBespokeTaxis.value = defaults.pctBespokeTaxis * 100;
        inputs.taxiCostPerDay.value = defaults.taxiCostPerDay;
        inputs.s1AppealsRate.value = defaults.s1AppealsRate * 100;
        inputs.s2AppealsRate.value = defaults.s2AppealsRate * 100;
        inputs.s3OmbudRate.value = defaults.s3OmbudRate * 100;
        inputs.appealsDecay.value = defaults.appealsDecay * 100;
        inputs.ongoingAdminCost.value = defaults.ongoingAdminCost;
        inputs.councilSavingsY7.value = defaults.councilSavingsY7;

        // Reset numeric value texts
        Object.keys(inputs).forEach(key => {
            const unit = inputs[key].dataset.unit || '';
            let valText = inputs[key].value;
            if (key === 'councilSavingsY7') {
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
        if (key === 'councilSavingsY7') {
            valText = formatGBP(valText);
        } else if (key === 'taxiCostPerDay' || key === 'ongoingAdminCost') {
            valText = '£' + parseFloat(valText).toLocaleString('en-GB');
        }
        values[key].textContent = `${valText}${unit}`;
    });
    
    // Initial render
    updateUI();
});
