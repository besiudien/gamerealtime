// Game state
const gameState = {
    resources: {
        metal: 500,
        crystal: 300,
        energy: 200,
        energyMax: 1000
    },
    production: {
        metal: 120,
        crystal: 60,
        energy: 200
    },
    buildings: {
        metalMine: 2,
        crystalMine: 1,
        solarPlant: 2,
        shipyard: 0,
        researchLab: 0,
        storage: 1
    },
    constructionQueue: []
};

// Generate random stars
function generateStars() {
    const starsContainer = document.getElementById('stars');
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.width = star.style.height = Math.random() * 3 + 'px';
        star.style.animationDelay = Math.random() * 3 + 's';
        starsContainer.appendChild(star);
    }
}

// Format time
function formatTime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m ${secs}s`;
    }
}

// Format number with K/M suffix
function formatNumber(num) {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return Math.floor(num).toString();
}

// Update resource display
function updateResourceDisplay() {
    document.getElementById('metal').textContent = formatNumber(gameState.resources.metal);
    document.getElementById('crystal').textContent = formatNumber(gameState.resources.crystal);
    document.getElementById('energy').textContent =
        `${formatNumber(gameState.resources.energy)} / ${formatNumber(gameState.resources.energyMax)}`;

    // Update production rates
    document.getElementById('metal-rate').textContent = gameState.production.metal;
    document.getElementById('crystal-rate').textContent = gameState.production.crystal;
    document.getElementById('energy-rate').textContent = gameState.production.energy;
}

// Update resources over time
function updateResources() {
    // Production per second (production per hour / 3600)
    gameState.resources.metal += gameState.production.metal / 3600 * 2; // 2 seconds interval
    gameState.resources.crystal += gameState.production.crystal / 3600 * 2;
    gameState.resources.energy = Math.min(
        gameState.resources.energyMax,
        gameState.resources.energy + gameState.production.energy / 3600 * 2
    );

    updateResourceDisplay();
}

// Update construction queue display
function updateConstructionQueueDisplay() {
    const queueContainer = document.getElementById('construction-queue');
    const emptyState = document.getElementById('queue-empty');

    if (gameState.constructionQueue.length === 0) {
        queueContainer.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    queueContainer.innerHTML = '';

    gameState.constructionQueue.forEach(item => {
        const buildingName = getTranslation(`building.${item.type}`);
        const progress = Math.min(100, ((item.totalTime - item.timeRemaining) / item.totalTime) * 100);

        const queueItem = document.createElement('div');
        queueItem.className = 'queue-item';
        queueItem.innerHTML = `
            <div class="queue-item-name">
                <span>${buildingName}</span>
                <span class="level-badge">Lv.${item.fromLevel} → ${item.toLevel}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%;"></div>
            </div>
            <div class="queue-time">⏰ ${formatTime(item.timeRemaining)}</div>
        `;
        queueContainer.appendChild(queueItem);
    });
}

// Render buildings grid
function renderBuildings() {
    const buildingsGrid = document.getElementById('buildings-grid');
    if (!buildingsGrid) return;

    buildingsGrid.innerHTML = '';

    const buildingOrder = ['metalMine', 'crystalMine', 'solarPlant', 'storage', 'shipyard', 'researchLab'];

    buildingOrder.forEach(buildingKey => {
        const info = getBuildingInfo(buildingKey, gameState);
        if (!info) return;

        const buildingName = getTranslation(`building.${buildingKey}`);
        const description = getTranslation(`buildings.descriptions.${buildingKey}`);
        const def = BUILDING_DEFINITIONS[buildingKey];

        // Create building card
        const card = document.createElement('div');
        card.className = 'building-card';
        if (!info.canUpgrade && info.level === 0) {
            card.classList.add('disabled');
        }

        // Prerequisite warning if any
        let prerequisiteHTML = '';
        if (info.reason === 'prerequisite') {
            const check = canUpgradeBuilding(buildingKey, gameState);
            const reqBuildingName = getTranslation(`building.${check.required}`);
            prerequisiteHTML = `
                <div class="prerequisite-warning">
                    ${getTranslation('buildings.requires')}: ${reqBuildingName} ${getTranslation('buildings.level')} ${check.requiredLevel}
                </div>
            `;
        }

        // Build stats HTML
        let statsHTML = '';
        if (def.productionBase) {
            const currentProd = info.currentProduction;
            const nextProd = info.production;
            statsHTML += `
                <div class="building-stat">
                    <span class="stat-label">${getTranslation('resource.metal')}/h</span>
                    <span class="stat-value positive">${currentProd} → ${nextProd}</span>
                </div>
            `;
        }

        if (def.energyProduction) {
            const currentProd = info.currentProduction;
            const nextProd = info.production;
            statsHTML += `
                <div class="building-stat">
                    <span class="stat-label">${getTranslation('resource.energy')}/h</span>
                    <span class="stat-value positive">${currentProd} → ${nextProd}</span>
                </div>
            `;
        }

        if (def.storageBase) {
            const currentStorage = info.currentProduction;
            const nextStorage = info.production;
            statsHTML += `
                <div class="building-stat">
                    <span class="stat-label">${getTranslation('buildings.production')}</span>
                    <span class="stat-value neutral">${formatNumber(currentStorage)} → ${formatNumber(nextStorage)}</span>
                </div>
            `;
        }

        if (def.energyConsumption > 0) {
            statsHTML += `
                <div class="building-stat">
                    <span class="stat-label">${getTranslation('buildings.energyUse')}</span>
                    <span class="stat-value neutral">-${info.energyConsumption}/h</span>
                </div>
            `;
        }

        statsHTML += `
            <div class="building-stat">
                <span class="stat-label">${getTranslation('buildings.buildTime')}</span>
                <span class="stat-value neutral">${formatTime(info.cost.time)}</span>
            </div>
        `;

        // Button state
        let btnText = getTranslation('buildings.upgrade');
        let btnClass = 'upgrade-btn';
        let btnDisabled = !info.canUpgrade;

        if (info.reason === 'inQueue') {
            btnText = getTranslation('buildings.inQueue');
            btnClass += ' in-queue';
            btnDisabled = true;
        } else if (info.reason === 'metal' || info.reason === 'crystal') {
            btnText = getTranslation('buildings.insufficient');
        }

        // Check resource sufficiency for styling
        const metalInsufficient = gameState.resources.metal < info.cost.metal;
        const crystalInsufficient = gameState.resources.crystal < info.cost.crystal;

        card.innerHTML = `
            <div class="building-header">
                <div class="building-icon">${def.icon}</div>
                <div class="building-title">
                    <div class="building-name">${buildingName}</div>
                    <div class="building-level">
                        ${getTranslation('buildings.level')}: <span class="building-level-value">${info.level}</span>
                    </div>
                </div>
            </div>
            
            <div class="building-description">${description}</div>
            
            ${prerequisiteHTML}
            
            <div class="building-stats">
                ${statsHTML}
            </div>
            
            <div class="building-costs">
                <div class="cost-item ${metalInsufficient ? 'insufficient' : ''}">
                    <div class="cost-icon" style="color: #ff9632;">⚙️</div>
                    <div class="cost-amount">${formatNumber(info.cost.metal)}</div>
                    <div class="cost-label">${getTranslation('resource.metal')}</div>
                </div>
                <div class="cost-item ${crystalInsufficient ? 'insufficient' : ''}">
                    <div class="cost-icon" style="color: #64c8ff;">💎</div>
                    <div class="cost-amount">${formatNumber(info.cost.crystal)}</div>
                    <div class="cost-label">${getTranslation('resource.crystal')}</div>
                </div>
            </div>
            
            <button class="${btnClass}" data-building="${buildingKey}" ${btnDisabled ? 'disabled' : ''}>
                ${btnText}
            </button>
        `;

        buildingsGrid.appendChild(card);
    });

    // Add event listeners to upgrade buttons
    buildingsGrid.querySelectorAll('.upgrade-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const buildingKey = e.target.getAttribute('data-building');
            if (startBuildingUpgrade(buildingKey, gameState)) {
                updateConstructionQueueDisplay();
                renderBuildings();
                updateResourceDisplay();
            }
        });
    });
}

// Tab switching
function setupTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active to clicked tab
            tab.classList.add('active');

            // Hide all tab panes
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });

            // Show selected tab pane
            const tabId = tab.getAttribute('data-tab');
            const pane = document.getElementById(`${tabId}-tab`);
            if (pane) {
                pane.classList.add('active');

                // Render buildings if buildings tab
                if (tabId === 'buildings') {
                    renderBuildings();
                }
            }
        });
    });
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    // Generate stars
    generateStars();

    // Setup tabs
    setupTabs();

    // Recalculate production based on initial buildings
    recalculateProduction(gameState);

    // Initial display
    updateResourceDisplay();
    updateConstructionQueueDisplay();

    // Update resources every 2 seconds
    setInterval(() => {
        updateResources();
    }, 2000);

    // Update construction queue every second
    setInterval(() => {
        const completed = updateConstructionQueue(gameState);
        if (completed.length > 0) {
            updateConstructionQueueDisplay();
            renderBuildings(); // Re-render if something completed
            updateResourceDisplay();
        } else if (gameState.constructionQueue.length > 0) {
            updateConstructionQueueDisplay(); // Just update timers
        }
    }, 1000);
});
