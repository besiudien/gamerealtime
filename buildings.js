// Building definitions and mechanics

const BUILDING_DEFINITIONS = {
    metalMine: {
        key: 'metalMine',
        icon: '⚙️',
        baseMetalCost: 60,
        baseCrystalCost: 15,
        baseTime: 20, // seconds
        costFactor: 1.5,
        timeFactor: 1.5,
        energyConsumption: 10,
        productionBase: 30,
        productionFactor: 1.1
    },
    crystalMine: {
        key: 'crystalMine',
        icon: '💎',
        baseMetalCost: 48,
        baseCrystalCost: 24,
        baseTime: 25,
        costFactor: 1.6,
        timeFactor: 1.5,
        energyConsumption: 10,
        productionBase: 20,
        productionFactor: 1.1
    },
    solarPlant: {
        key: 'solarPlant',
        icon: '⚡',
        baseMetalCost: 75,
        baseCrystalCost: 30,
        baseTime: 30,
        costFactor: 1.5,
        timeFactor: 1.5,
        energyConsumption: 0,
        energyProduction: 20,
        productionFactor: 1.1
    },
    storage: {
        key: 'storage',
        icon: '📦',
        baseMetalCost: 100,
        baseCrystalCost: 50,
        baseTime: 40,
        costFactor: 2.0,
        timeFactor: 1.5,
        energyConsumption: 0,
        storageBase: 10000,
        storageFactor: 2.0
    },
    shipyard: {
        key: 'shipyard',
        icon: '🚢',
        baseMetalCost: 400,
        baseCrystalCost: 200,
        baseTime: 120,
        costFactor: 2.0,
        timeFactor: 2.0,
        energyConsumption: 50,
        prerequisite: { metalMine: 2 }
    },
    researchLab: {
        key: 'researchLab',
        icon: '🔬',
        baseMetalCost: 200,
        baseCrystalCost: 400,
        baseTime: 180,
        costFactor: 2.0,
        timeFactor: 2.0,
        energyConsumption: 30,
        prerequisite: { crystalMine: 3 }
    }
};

// Calculate building cost for next level
function calculateBuildingCost(buildingKey, currentLevel) {
    const def = BUILDING_DEFINITIONS[buildingKey];
    if (!def) return null;

    const level = currentLevel + 1;
    return {
        metal: Math.floor(def.baseMetalCost * Math.pow(def.costFactor, currentLevel)),
        crystal: Math.floor(def.baseCrystalCost * Math.pow(def.costFactor, currentLevel)),
        time: Math.floor(def.baseTime * Math.pow(def.timeFactor, currentLevel))
    };
}

// Calculate building production for current level
function calculateBuildingProduction(buildingKey, level) {
    const def = BUILDING_DEFINITIONS[buildingKey];
    if (!def) return 0;

    if (def.productionBase) {
        return Math.floor(def.productionBase * level * Math.pow(def.productionFactor, level));
    }

    if (def.energyProduction) {
        return Math.floor(def.energyProduction * level * Math.pow(def.productionFactor, level));
    }

    if (def.storageBase) {
        return Math.floor(def.storageBase * Math.pow(def.storageFactor, level - 1));
    }

    return 0;
}

// Check if building can be upgraded
function canUpgradeBuilding(buildingKey, gameState) {
    const def = BUILDING_DEFINITIONS[buildingKey];
    if (!def) return { canUpgrade: false, reason: 'unknown' };

    const currentLevel = gameState.buildings[buildingKey] || 0;
    const cost = calculateBuildingCost(buildingKey, currentLevel);

    // Check prerequisites
    if (def.prerequisite) {
        for (const [reqBuilding, reqLevel] of Object.entries(def.prerequisite)) {
            if ((gameState.buildings[reqBuilding] || 0) < reqLevel) {
                return {
                    canUpgrade: false,
                    reason: 'prerequisite',
                    required: reqBuilding,
                    requiredLevel: reqLevel
                };
            }
        }
    }

    // Check if already in queue
    const inQueue = gameState.constructionQueue.some(item => item.type === buildingKey);
    if (inQueue) {
        return { canUpgrade: false, reason: 'inQueue' };
    }

    // Check resources
    if (gameState.resources.metal < cost.metal) {
        return { canUpgrade: false, reason: 'metal' };
    }
    if (gameState.resources.crystal < cost.crystal) {
        return { canUpgrade: false, reason: 'crystal' };
    }

    return { canUpgrade: true, cost };
}

// Start building upgrade
function startBuildingUpgrade(buildingKey, gameState) {
    const check = canUpgradeBuilding(buildingKey, gameState);
    if (!check.canUpgrade) return false;

    const currentLevel = gameState.buildings[buildingKey] || 0;
    const cost = check.cost;

    // Deduct resources
    gameState.resources.metal -= cost.metal;
    gameState.resources.crystal -= cost.crystal;

    // Add to construction queue
    gameState.constructionQueue.push({
        type: buildingKey,
        fromLevel: currentLevel,
        toLevel: currentLevel + 1,
        totalTime: cost.time,
        timeRemaining: cost.time,
        startTime: Date.now()
    });

    return true;
}

// Update construction queue (call every second)
function updateConstructionQueue(gameState) {
    if (gameState.constructionQueue.length === 0) return [];

    const completed = [];

    gameState.constructionQueue.forEach((item, index) => {
        if (item.timeRemaining > 0) {
            item.timeRemaining -= 1;

            // If completed
            if (item.timeRemaining <= 0) {
                gameState.buildings[item.type] = item.toLevel;
                completed.push(index);

                // Recalculate production
                recalculateProduction(gameState);
            }
        }
    });

    // Remove completed items (in reverse to maintain indices)
    completed.reverse().forEach(index => {
        gameState.constructionQueue.splice(index, 1);
    });

    return completed;
}

// Recalculate total production based on current buildings
function recalculateProduction(gameState) {
    const metalProd = calculateBuildingProduction('metalMine', gameState.buildings.metalMine || 0);
    const crystalProd = calculateBuildingProduction('crystalMine', gameState.buildings.crystalMine || 0);
    const energyProd = calculateBuildingProduction('solarPlant', gameState.buildings.solarPlant || 0);

    gameState.production.metal = metalProd;
    gameState.production.crystal = crystalProd;
    gameState.production.energy = energyProd;

    // Update energy max
    gameState.resources.energyMax = energyProd * 10; // Energy capacity is 10x production
}

// Get all building info for display
function getBuildingInfo(buildingKey, gameState) {
    const def = BUILDING_DEFINITIONS[buildingKey];
    if (!def) return null;

    const currentLevel = gameState.buildings[buildingKey] || 0;
    const cost = calculateBuildingCost(buildingKey, currentLevel);
    const production = calculateBuildingProduction(buildingKey, currentLevel + 1);
    const currentProduction = calculateBuildingProduction(buildingKey, currentLevel);
    const upgradeCheck = canUpgradeBuilding(buildingKey, gameState);

    return {
        key: buildingKey,
        icon: def.icon,
        level: currentLevel,
        cost,
        production,
        currentProduction,
        canUpgrade: upgradeCheck.canUpgrade,
        reason: upgradeCheck.reason,
        energyConsumption: def.energyConsumption * (currentLevel + 1)
    };
}
