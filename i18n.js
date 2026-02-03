// i18n translations for Vietnamese and English
const translations = {
    vi: {
        title: "GALACTIC OUTPOST",

        // Navigation
        nav: {
            dashboard: "Tổng quan",
            buildings: "Công trình",
            fleet: "Hạm đội",
            research: "Nghiên cứu",
            missions: "Nhiệm vụ"
        },

        // Resources
        resource: {
            metal: "Kim loại",
            crystal: "Pha lê",
            energy: "Năng lượng"
        },

        // Overview
        overview: {
            title: "Tổng quan",
            level: "Cấp độ căn cứ",
            buildings: "Công trình",
            ships: "Tàu chiến",
            research: "Công nghệ"
        },

        // Construction Queue
        queue: {
            title: "Hàng đợi xây dựng",
            empty: "Không có công trình đang xây dựng"
        },

        // Buildings
        building: {
            metalMine: "Mỏ kim loại",
            crystalMine: "Mỏ pha lê",
            solarPlant: "Nhà máy năng lượng",
            shipyard: "Xưởng đóng tàu",
            researchLab: "Phòng thí nghiệm",
            storage: "Kho chứa"
        },

        buildings: {
            subtitle: "Nâng cấp công trình để tăng sản xuất và mở khóa tính năng mới",
            level: "Cấp độ",
            production: "Sản lượng",
            energyUse: "Tiêu thụ năng lượng",
            buildTime: "Thời gian",
            upgrade: "Nâng cấp",
            inQueue: "Đang xây dựng",
            insufficient: "Không đủ tài nguyên",
            requires: "Yêu cầu",
            descriptions: {
                metalMine: "Khai thác kim loại từ tiểu hành tinh gần đó. Mỗi cấp độ tăng sản lượng kim loại.",
                crystalMine: "Khai thác tinh thể năng lượng quý hiếm. Cần thiết cho công nghệ tiên tiến.",
                solarPlant: "Thu thập năng lượng từ mặt trời. Cung cấp năng lượng cho tất cả công trình.",
                storage: "Kho chứa tài nguyên. Tăng giới hạn lưu trữ tài nguyên.",
                shipyard: "Đóng tàu chiến và tàu vận tải. Yêu cầu Mỏ kim loại cấp 2.",
                researchLab: "Nghiên cứu công nghệ mới. Yêu cầu Mỏ pha lê cấp 3."
            }
        },

        // Station
        station: {
            name: "Căn cứ Alpha-01",
            sector: "Khu vực Ngân hà 451"
        },

        // Actions
        action: {
            build: "Xây dựng",
            research: "Nghiên cứu",
            deploy: "Điều động",
            attack: "Tấn công"
        },

        // Production
        production: {
            title: "Sản xuất/Giờ"
        },

        // Activity
        activity: {
            title: "Hoạt động gần đây",
            completed: "Hoàn thành: Mỏ pha lê Lv.3",
            fleet: "Hạm đội quay về từ nhiệm vụ",
            storage: "Kho chứa sắp đầy"
        },

        // Common
        comingSoon: "Đang phát triển..."
    },

    en: {
        title: "GALACTIC OUTPOST",

        // Navigation
        nav: {
            dashboard: "Dashboard",
            buildings: "Buildings",
            fleet: "Fleet",
            research: "Research",
            missions: "Missions"
        },

        // Resources
        resource: {
            metal: "Metal",
            crystal: "Crystal",
            energy: "Energy"
        },

        // Overview
        overview: {
            title: "Overview",
            level: "Base Level",
            buildings: "Buildings",
            ships: "Ships",
            research: "Research"
        },

        // Construction Queue
        queue: {
            title: "Construction Queue",
            empty: "No construction in progress"
        },

        // Buildings
        building: {
            metalMine: "Metal Mine",
            crystalMine: "Crystal Mine",
            solarPlant: "Solar Plant",
            shipyard: "Shipyard",
            researchLab: "Research Lab",
            storage: "Storage"
        },

        buildings: {
            subtitle: "Upgrade buildings to increase production and unlock new features",
            level: "Level",
            production: "Production",
            energyUse: "Energy Consumption",
            buildTime: "Build Time",
            upgrade: "Upgrade",
            inQueue: "In Construction",
            insufficient: "Insufficient Resources",
            requires: "Requires",
            descriptions: {
                metalMine: "Mine metal from nearby asteroids. Each level increases metal production.",
                crystalMine: "Extract rare energy crystals. Essential for advanced technology.",
                solarPlant: "Harvest energy from the sun. Powers all your buildings.",
                storage: "Store resources. Increases resource storage capacity.",
                shipyard: "Build warships and transports. Requires Metal Mine level 2.",
                researchLab: "Research new technologies. Requires Crystal Mine level 3."
            }
        },

        // Station
        station: {
            name: "Base Alpha-01",
            sector: "Galaxy Sector 451"
        },

        // Actions
        action: {
            build: "Build",
            research: "Research",
            deploy: "Deploy",
            attack: "Attack"
        },

        // Production
        production: {
            title: "Production/Hour"
        },

        // Activity
        activity: {
            title: "Recent Activity",
            completed: "Completed: Crystal Mine Lv.3",
            fleet: "Fleet returned from mission",
            storage: "Storage almost full"
        },

        // Common
        comingSoon: "Coming Soon..."
    }
};

// Current language
let currentLang = localStorage.getItem('lang') || 'vi';

// Get nested translation value
function getTranslation(key) {
    const keys = key.split('.');
    let value = translations[currentLang];

    for (const k of keys) {
        value = value[k];
        if (!value) return key;
    }

    return value;
}

// Apply translations to page
function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = getTranslation(key);
    });

    // Update document title
    const titleKey = document.querySelector('[data-i18n="title"]')?.getAttribute('data-i18n');
    if (titleKey) {
        document.title = `${getTranslation('title')} - ${currentLang === 'vi' ? 'Chiến lược không gian thời gian thực' : 'Real-time Space Strategy'}`;
    }

    // Update HTML lang attribute
    document.documentElement.lang = currentLang;
}

// Switch language
function switchLanguage(lang) {
    if (lang === currentLang) return;

    currentLang = lang;
    localStorage.setItem('lang', lang);

    // Update active button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    // Apply translations
    applyTranslations();

    // Re-render buildings if on buildings tab
    const buildingsTab = document.getElementById('buildings-tab');
    if (buildingsTab && buildingsTab.classList.contains('active')) {
        if (typeof renderBuildings === 'function') {
            renderBuildings();
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Set up language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchLanguage(btn.getAttribute('data-lang'));
        });

        // Set active state
        if (btn.getAttribute('data-lang') === currentLang) {
            btn.classList.add('active');
        }
    });

    // Apply initial translations
    applyTranslations();
});
