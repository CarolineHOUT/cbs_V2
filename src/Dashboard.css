* {
box-sizing: border-box;
}

body {
margin: 0;
background: #f5f7fb;
color: #172b4d;
font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
sans-serif;
}

.dashboard-page {
min-height: 100vh;
background: #f5f7fb;
}

/* HEADER */

.top-header {
position: sticky;
top: 0;
z-index: 50;
height: 76px;
display: flex;
align-items: center;
justify-content: space-between;
gap: 16px;
padding: 14px 20px;
background: linear-gradient(90deg, #0f4cb8 0%, #2563eb 100%);
color: white;
box-shadow: 0 8px 24px rgba(16, 38, 84, 0.12);
}

.header-left,
.header-right {
display: flex;
align-items: center;
gap: 14px;
}

.brand-block h1 {
margin: 0;
font-size: 30px;
line-height: 1;
font-weight: 800;
letter-spacing: 0.3px;
}

.brand-block p {
margin: 4px 0 0;
font-size: 13px;
opacity: 0.92;
}

.icon-btn,
.ghost-btn,
.crisis-button {
border: none;
border-radius: 14px;
cursor: pointer;
font-weight: 700;
}

.icon-btn {
width: 44px;
height: 44px;
background: rgba(255, 255, 255, 0.14);
color: white;
font-size: 20px;
}

.ghost-btn {
padding: 12px 16px;
background: rgba(255, 255, 255, 0.14);
color: white;
font-size: 14px;
}

.crisis-button {
padding: 12px 16px;
background: white;
color: #0f4cb8;
font-size: 14px;
}

/* LEFT SIDEBAR */

.left-sidebar {
position: fixed;
top: 76px;
left: 0;
bottom: 0;
background: white;
border-right: 1px solid #e7edf5;
box-shadow: 0 8px 24px rgba(16, 38, 84, 0.06);
z-index: 30;
transition: width 0.25s ease;
overflow: hidden;
}

.left-sidebar.expanded {
width: 220px;
}

.left-sidebar.collapsed {
width: 72px;
}

.left-sidebar-nav {
display: flex;
flex-direction: column;
gap: 10px;
padding: 16px 12px;
}

.sidebar-link {
display: flex;
align-items: center;
gap: 12px;
height: 48px;
padding: 0 12px;
border: none;
border-radius: 14px;
background: transparent;
color: #1f3558;
font-size: 15px;
font-weight: 700;
text-align: left;
cursor: pointer;
white-space: nowrap;
}

.sidebar-link.active,
.sidebar-link:hover {
background: #eaf1ff;
color: #0f4cb8;
}

.sidebar-icon {
min-width: 24px;
text-align: center;
font-size: 18px;
}

/* RIGHT RAIL */

.right-rail {
position: fixed;
top: 76px;
right: 0;
bottom: 0;
width: 290px;
background: white;
border-left: 1px solid #e7edf5;
box-shadow: 0 8px 24px rgba(16, 38, 84, 0.06);
z-index: 25;
transition: transform 0.25s ease;
}

.right-rail.open {
transform: translateX(0);
}

.right-rail.closed {
transform: translateX(100%);
}

.rail-list {
padding: 12px 14px 18px;
display: flex;
flex-direction: column;
gap: 10px;
}

.rail-service-card {
width: 100%;
border: 1px solid #e5ebf4;
background: #fbfcfe;
border-radius: 14px;
padding: 14px;
text-align: left;
cursor: pointer;
}

.rail-service-card:hover {
border-color: #bfd1f5;
background: #f5f8ff;
}

.rail-card-top,
.rail-card-bottom {
display: flex;
align-items: center;
justify-content: space-between;
gap: 12px;
}

.rail-card-bottom {
margin-top: 8px;
color: #66758a;
font-size: 13px;
}

.rail-link {
color: #0f4cb8;
font-weight: 700;
}

.rail-service-name {
font-weight: 800;
font-size: 15px;
}

.rail-service-occupation {
font-size: 16px;
font-weight: 800;
}

.danger {
color: #d92d20;
}

.warning {
color: #d97706;
}

.normal {
color: #2b6cb0;
}

/* MAIN */

.dashboard-main {
padding: 22px 24px 32px;
transition: margin-left 0.25s ease, margin-right 0.25s ease;
}

.dashboard-main.with-left-sidebar {
margin-left: 220px;
}

.dashboard-main.with-left-sidebar-collapsed {
margin-left: 72px;
}

.dashboard-main.with-right-rail {
margin-right: 290px;
}

.dashboard-main.without-right-rail {
margin-right: 0;
}

/* KPI */

.kpi-row {
display: grid;
grid-template-columns: repeat(5, minmax(0, 1fr));
gap: 14px;
margin-bottom: 16px;
}

.kpi-card {
border-radius: 18px;
padding: 18px;
min-height: 102px;
display: flex;
flex-direction: column;
justify-content: space-between;
box-shadow: 0 8px 24px rgba(16, 38, 84, 0.08);
}

.kpi-card.teal {
background: #0f9d94;
color: white;
}

.kpi-card.blue {
background: #2563eb;
color: white;
}

.kpi-card.orange {
background: #f59e0b;
color: white;
}

.kpi-card.red {
background: #ef4444;
color: white;
}

.kpi-card.light {
background: white;
color: #172b4d;
border: 1px solid #dbe3ef;
}

.kpi-label {
font-size: 14px;
font-weight: 700;
}

.kpi-value {
font-size: 34px;
line-height: 1;
font-weight: 800;
}

/* FILTERS */

.filters-panel {
background: white;
border-radius: 18px;
padding: 16px;
margin-bottom: 16px;
box-shadow: 0 8px 24px rgba(16, 38, 84, 0.08);
}

.filters-header {
display: flex;
align-items: center;
justify-content: space-between;
margin-bottom: 12px;
}

.filters-title {
font-size: 18px;
font-weight: 800;
}

.reset-filters-btn {
border: 1px solid #d5ddeb;
background: white;
color: #1f3558;
padding: 8px 12px;
border-radius: 10px;
font-size: 13px;
font-weight: 700;
cursor: pointer;
}

.filter-group + .filter-group {
margin-top: 14px;
}

.filter-label {
font-size: 14px;
font-weight: 800;
color: #485a73;
margin-bottom: 8px;
}

.chip-row {
display: flex;
flex-wrap: wrap;
gap: 8px;
}

.chip {
border: 1px solid #d5ddeb;
background: white;
color: #1f3558;
padding: 9px 13px;
border-radius: 999px;
font-size: 13px;
font-weight: 700;
cursor: pointer;
}

.chip.selected {
background: #0f4cb8;
color: white;
border-color: #0f4cb8;
}

.filter-search {
margin-top: 14px;
}

.filter-search input {
width: 100%;
border: 1px solid #d5ddeb;
border-radius: 12px;
padding: 12px 14px;
font-size: 14px;
background: white;
}

/* TABLE / CARDS */

.patients-card,
.mobile-cards {
background: white;
border-radius: 18px;
box-shadow: 0 8px 24px rgba(16, 38, 84, 0.08);
}

.section-title {
padding: 16px 18px;
border-bottom: 1px solid #e7edf5;
font-size: 20px;
font-weight: 800;
}

.patients-table-wrapper {
overflow-x: auto;
}

.patients-table {
width: 100%;
border-collapse: collapse;
}

.patients-table th,
.patients-table td {
padding: 12px 10px;
text-align: left;
vertical-align: top;
border-bottom: 1px solid #edf2f8;
}

.patients-table th {
font-size: 13px;
font-weight: 800;
color: #495a74;
background: #fbfcfe;
white-space: nowrap;
}

.patient-row:hover {
background: #fcfdff;
}

.priority-badge {
width: 32px;
height: 32px;
display: inline-flex;
align-items: center;
justify-content: center;
border-radius: 999px;
background: #ef4444;
color: white;
font-weight: 800;
font-size: 14px;
}

.identity-block,
.location-block {
display: flex;
flex-direction: column;
gap: 3px;
}

.patient-link {
font-weight: 800;
font-size: 15px;
color: #0f4cb8;
text-decoration: none;
}

.patient-link:hover {
text-decoration: underline;
}

.identity-line,
.location-line {
color: #5f6b7a;
font-size: 13px;
line-height: 1.3;
}

.location-service {
font-weight: 800;
font-size: 15px;
}

.sort-med-toggle {
border: 1px solid #cfd9e8;
background: #f8fafc;
color: #1f3558;
border-radius: 10px;
padding: 8px 10px;
font-size: 13px;
font-weight: 800;
cursor: pointer;
min-width: 112px;
}

.sort-med-toggle.active {
background: #e7f5ea;
border-color: #87c995;
color: #14532d;
}

.maturity-badge,
.frein-badge,
.days-badge,
.alert-pill {
display: inline-block;
border-radius: 999px;
padding: 8px 10px;
font-size: 13px;
font-weight: 700;
white-space: nowrap;
}

.maturity-badge {
background: #eef4ff;
color: #22447e;
}

.frein-badge {
background: #fff0d6;
color: #7a4d00;
}

.days-badge {
min-width: 54px;
text-align: center;
}

.days-badge.neutral {
background: #eef2f7;
color: #475569;
}

.days-badge.warning {
background: #fff4e5;
color: #b45309;
}

.days-badge.critical {
background: #fff1f2;
color: #be123c;
}

.days-empty {
color: #8a94a5;
font-weight: 700;
}

.expand-btn {
border: 1px solid #d5ddeb;
background: white;
color: #1f3558;
padding: 8px 10px;
border-radius: 10px;
font-size: 12px;
font-weight: 700;
cursor: pointer;
}

.expanded-row td {
background: #fbfcfe;
}

.expanded-content {
display: grid;
grid-template-columns: repeat(4, minmax(0, 1fr));
gap: 14px;
padding: 4px 0;
}

.expanded-block {
display: grid;
gap: 6px;
}

.expanded-label {
font-size: 12px;
font-weight: 800;
color: #5b6c85;
}

.expanded-actions {
display: flex;
align-items: flex-end;
}

.open-patient-btn {
display: inline-flex;
align-items: center;
justify-content: center;
border-radius: 12px;
padding: 10px 12px;
background: #0f4cb8;
color: white;
text-decoration: none;
font-size: 13px;
font-weight: 700;
}

.empty-row,
.empty-mobile {
text-align: center;
color: #6b7788;
padding: 24px !important;
}

.mobile-cards {
display: none;
}

.patient-cards-list {
padding: 14px;
display: grid;
gap: 12px;
}

.patient-card {
border: 1px solid #e7edf5;
border-radius: 16px;
padding: 14px;
background: #fbfcfe;
}

.patient-card-top {
display: flex;
align-items: center;
justify-content: space-between;
margin-bottom: 10px;
}

.mobile-space {
margin-top: 8px;
}

.patient-card-tags {
display: flex;
flex-wrap: wrap;
gap: 8px;
margin-top: 12px;
}

.patient-alerts {
display: flex;
flex-wrap: wrap;
gap: 8px;
margin-top: 12px;
}

.alert-pill {
background: #eef2f7;
color: #334155;
}

.alert-pill.urgent {
background: #fff1f2;
color: #be123c;
}

.mobile-expanded {
margin-top: 12px;
padding-top: 12px;
border-top: 1px solid #e7edf5;
display: grid;
gap: 10px;
}

.mobile-days {
padding-left: 4px;
padding-right: 4px;
}

/* RESPONSIVE */

@media (max-width: 1400px) {
.kpi-row {
grid-template-columns: repeat(3, minmax(0, 1fr));
}

.expanded-content {
grid-template-columns: repeat(2, minmax(0, 1fr));
}
}

@media (max-width: 1100px) {
.right-rail {
width: 260px;
}

.dashboard-main.with-right-rail {
margin-right: 260px;
}
}

@media (max-width: 900px) {
.top-header {
flex-direction: column;
align-items: stretch;
height: auto;
}

.header-left,
.header-right {
justify-content: space-between;
}

.left-sidebar {
top: 98px;
}

.right-rail {
top: 98px;
width: 92%;
}

.dashboard-main {
padding: 18px;
}

.dashboard-main.with-left-sidebar,
.dashboard-main.with-left-sidebar-collapsed {
margin-left: 0;
}

.dashboard-main.with-right-rail,
.dashboard-main.without-right-rail {
margin-right: 0;
}

.left-sidebar.expanded {
width: 240px;
transform: translateX(0);
}

.left-sidebar.collapsed {
width: 240px;
transform: translateX(-105%);
}

.kpi-row {
grid-template-columns: repeat(2, minmax(0, 1fr));
}

.desktop-table {
display: none;
}

.mobile-cards {
display: block;
}
}

@media (max-width: 640px) {
.brand-block h1 {
font-size: 24px;
}

.brand-block p {
font-size: 12px;
}

.kpi-row {
grid-template-columns: 1fr;
}

.sort-med-toggle {
min-width: 96px;
font-size: 12px;
}

.section-title {
font-size: 18px;
}

.chip-row {
overflow-x: auto;
flex-wrap: nowrap;
padding-bottom: 4px;
}

.chip-row::-webkit-scrollbar {
height: 6px;
}
}
