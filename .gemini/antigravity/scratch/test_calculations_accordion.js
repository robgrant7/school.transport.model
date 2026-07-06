function runScenario(childrenAffected, optOutRate, minibusThreshold, coachThreshold, taxiCost, taxiCap, minibusCost, minibusCap, coachCost, coachCap) {
    const erosionRate = 0.10;
    const numberOfZones = 50;
    const isolationRate = 0.25;
    const schoolDays = 190;
    const schoolCareer = 5;

    const actualAffected = Math.round(childrenAffected * (1 - optOutRate) * 100) / 100;
    console.log(`\nScenario: Affected=${childrenAffected}, OptOut=${optOutRate*100}%, MinibusThreshold=${minibusThreshold}, CoachThreshold=${coachThreshold}`);
    console.log(`Taxi Cost=£${taxiCost}, Capacity=${taxiCap} | Minibus Cost=£${minibusCost}, Capacity=${minibusCap} | Coach Cost=£${coachCost}, Capacity=${coachCap}`);
    console.log(`Actual Affected: ${actualAffected}`);

    for (let t of [1, 5]) {
        let zonePop = 0;
        for (let age = 1; age <= Math.min(t, schoolCareer); age++) {
            zonePop += (actualAffected * Math.pow(1 - erosionRate, age - 1)) / numberOfZones;
        }

        const isolatedPupils = zonePop * isolationRate;
        const isolatedTaxis = isolatedPupils / taxiCap;
        const remPupils = zonePop - isolatedPupils;

        let groupTaxis = 0;
        let groupMinibuses = 0;
        let groupCoaches = 0;
        let selectedTier = "Taxi";

        if (remPupils < minibusThreshold) {
            groupTaxis = remPupils / taxiCap;
            selectedTier = "Taxi";
        } else if (remPupils < coachThreshold) {
            groupMinibuses = remPupils / minibusCap;
            selectedTier = "Minibus";
        } else {
            groupCoaches = remPupils / coachCap;
            selectedTier = "Coach";
        }

        const taxis = (isolatedTaxis + groupTaxis) * numberOfZones;
        const minibuses = groupMinibuses * numberOfZones;
        const coaches = groupCoaches * numberOfZones;

        const zoneCost = (isolatedTaxis + groupTaxis) * taxiCost + 
                         groupMinibuses * minibusCost +
                         groupCoaches * coachCost;
        const spotCost = zoneCost * numberOfZones * schoolDays;

        console.log(`  Year ${t}: Pop/Zone=${zonePop.toFixed(2)}, Rem/Zone=${remPupils.toFixed(2)} | Tier=${selectedTier} | Taxis=${taxis.toFixed(2)}, Minibuses=${minibuses.toFixed(2)}, Coaches=${coaches.toFixed(2)} | Cost=£${Math.round(spotCost).toLocaleString()}`);
    }
}

// Run the scenarios using the user defaults
console.log("=== RUNNING SCENARIO TESTS ===");
runScenario(340, 0.70, 8, 17, 125, 3, 175, 16, 300, 50); // Defaults
runScenario(340, 0.50, 8, 17, 125, 3, 175, 16, 300, 50); // Low opt-out (more kids)
runScenario(600, 0.30, 8, 17, 130, 3, 190, 16, 320, 50); // High cost scenario
