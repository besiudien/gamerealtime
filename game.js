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

// Save System
function saveGame() {
    const data = {
        resources: gameState.resources,
        buildings: gameState.buildings,
        constructionQueue: gameState.constructionQueue,
        lastSaveTime: Date.now(),
        production: gameState.production // Save production for immediate display on load
    };

    // Create detailed save string
    const jsonStr = JSON.stringify(data);
    const saveStr = btoa(jsonStr); // Simple Base64 encoding

    localStorage.setItem('galacticOutpost_save', saveStr);
    console.log('Game Saved at ' + new Date().toLocaleTimeString());

    // Optional: Visual feedback if needed
    showToast(getTranslation('ui.gameSaved'));
}

function loadGame() {
    const saved = localStorage.getItem('galacticOutpost_save');
    if (!saved) return false;

    try {
        const jsonStr = atob(saved);
        const data = JSON.parse(jsonStr);

        // Merge data
        if (data.resources) gameState.resources = { ...gameState.resources, ...data.resources };
        if (data.buildings) gameState.buildings = { ...gameState.buildings, ...data.buildings };
        if (data.constructionQueue) gameState.constructionQueue = data.constructionQueue;

        // Calculate Offline Progress
        if (data.lastSaveTime) {
            const now = Date.now();
            const elapsedSeconds = (now - data.lastSaveTime) / 1000;

            if (elapsedSeconds > 10) { // Only if away > 10s
                processOfflineProgress(elapsedSeconds, data.production);
            }
        }

        return true;
    } catch (e) {
        console.error('Failed to load save:', e);
        return false;
    }
}

function processOfflineProgress(seconds, production) {
    // Recalculate based on current building levels just to be safe, or use saved production
    // Using saved production is safer for correct calculation at that snapshot
    const prod = production || gameState.production;

    const metalGained = Math.floor(prod.metal * (seconds / 3600));
    const crystalGained = Math.floor(prod.crystal * (seconds / 3600));
    // Energy doesn't accumulate but we might want to cap it? No, just rate.

    gameState.resources.metal += metalGained;
    gameState.resources.crystal += crystalGained;

    // Advance queue
    if (gameState.constructionQueue.length > 0) {
        // Simple logic: reduce remaining time of first item
        // A robust offline queue is complex, let's just reduce current item
        let remainingSeconds = seconds;

        // This is a simplified approach. A full simulation would be recursive.
        // For now, let's just deduct time from the running queue items in order
        // Note: In our main loop we only process first item usually? 
        // Actually our updateConstructionQueue processes ALL items, but sequentially?
        // Let's look at updateConstructionQueue: it decrements all? No, usually building queues are serial.
        // Our updateConstructionQueue reduces timeRemaining for ALL items. So parallel construction?

        // Let's assume parallel for this implementation based on previous code:
        gameState.constructionQueue.forEach(item => {
            item.timeRemaining = Math.max(0, item.timeRemaining - seconds);
        });
    }

    // Show offline modal
    setTimeout(() => {
        alert(getTranslation('ui.welcomeBack') + `\n\n` +
            getTranslation('resource.metal') + `: +${formatNumber(metalGained)}\n` +
            getTranslation('resource.crystal') + `: +${formatNumber(crystalGained)}\n` +
            `(${formatTime(seconds)} ${getTranslation('ui.offline')})`);
    }, 500);
}

function exportSave() {
    saveGame(); // Ensure latest state
    const saved = localStorage.getItem('galacticOutpost_save');
    return saved;
}

function importSave(saveStr) {
    try {
        const jsonStr = atob(saveStr);
        const data = JSON.parse(jsonStr);
        // Basic validation
        if (!data.resources || !data.buildings) throw new Error('Invalid Save Data');

        localStorage.setItem('galacticOutpost_save', saveStr);
        location.reload(); // Reload to apply cleanly
        return true;
    } catch (e) {
        alert(getTranslation('ui.importError'));
        return false;
    }
}

function resetGame() {
    if (confirm(getTranslation('ui.resetConfirm'))) {
        localStorage.removeItem('galacticOutpost_save');
        location.reload();
    }
}

function showToast(message) {
    // Create toast element if not exists or reuse
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = `
            position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
            background: rgba(0, 245, 255, 0.2); border: 1px solid #00f5ff;
            color: #fff; padding: 10px 20px; border-radius: 20px;
            pointer-events: none; opacity: 0; transition: opacity 0.3s;
            z-index: 1000; font-family: 'Rajdhani', sans-serif;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    // Generate stars
    generateStars();

    // Setup tabs
    setupTabs();

    // Try calculate production early if possible
    recalculateProduction(gameState);

    // LOAD GAME
    const loaded = loadGame();
    if (loaded) {
        recalculateProduction(gameState); // Recalculate after loading buildings
        updateConstructionQueueDisplay();
        renderBuildings(); // Ensure buildings show correct levels
    }

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
            saveGame(); // Save on meaningful event
        } else if (gameState.constructionQueue.length > 0) {
            updateConstructionQueueDisplay(); // Just update timers
        }
    }, 1000);

    // Auto Save every 30 seconds
    setInterval(() => {
        saveGame();
    }, 30000);

    // Setup UI Listeners
    setupUI();
});

// UI Event Listeners
function setupUI() {
    const modal = document.getElementById('settings-modal');
    const openBtn = document.getElementById('open-settings-btn');
    const closeBtn = document.getElementById('close-settings-btn');

    // Open/Close Modal
    if (openBtn) openBtn.addEventListener('click', () => {
        modal.classList.add('active');
        document.getElementById('io-container').style.display = 'none'; // Reset IO view
    });

    if (closeBtn) closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    // Close on click outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Save/Reset
    document.getElementById('btn-save')?.addEventListener('click', saveGame);
    document.getElementById('btn-reset')?.addEventListener('click', resetGame);

    // Export
    document.getElementById('btn-export')?.addEventListener('click', () => {
        const ioContainer = document.getElementById('io-container');
        const textarea = document.getElementById('io-textarea');
        const copyBtn = document.getElementById('btn-copy');
        const loadBtn = document.getElementById('btn-load-import');

        ioContainer.style.display = 'flex';
        textarea.value = exportSave();
        textarea.readOnly = true;

        copyBtn.style.display = 'block';
        loadBtn.style.display = 'none';

        // Auto select
        textarea.select();
    });

    // Import
    document.getElementById('btn-import')?.addEventListener('click', () => {
        const ioContainer = document.getElementById('io-container');
        const textarea = document.getElementById('io-textarea');
        const copyBtn = document.getElementById('btn-copy');
        const loadBtn = document.getElementById('btn-load-import');

        ioContainer.style.display = 'flex';
        textarea.value = '';
        textarea.placeholder = 'Paste save string here...';
        textarea.readOnly = false;

        copyBtn.style.display = 'none';
        loadBtn.style.display = 'block';

        textarea.focus();
    });

    // Copy Action
    document.getElementById('btn-copy')?.addEventListener('click', () => {
        const textarea = document.getElementById('io-textarea');
        textarea.select();
        document.execCommand('copy');
        showToast(getTranslation('ui.copied'));
    });

    // Load Action
    document.getElementById('btn-load-import')?.addEventListener('click', () => {
        const textarea = document.getElementById('io-textarea');
        if (textarea.value.trim()) {
            importSave(textarea.value.trim());
        }
    });
}
