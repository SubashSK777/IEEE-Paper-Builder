const API_BASE = "http://localhost:8000/api";

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Initial IEEE sections
const DEFAULT_IEEE_SECTIONS = [
    { id: generateId(), name: "Title", content: "" },
    { id: generateId(), name: "Authors", content: "" },
    { id: generateId(), name: "Affiliations", content: "" },
    { id: generateId(), name: "Abstract", content: "" },
    { id: generateId(), name: "Keywords", content: "" },
    { id: generateId(), name: "Introduction", content: "" },
    { id: generateId(), name: "Related Work", content: "" },
    { id: generateId(), name: "Methodology", content: "" },
    { id: generateId(), name: "Results and Discussion", content: "" },
    { id: generateId(), name: "Conclusion", content: "" },
    { id: generateId(), name: "References", content: "" }
];

let state = {
    sections: [],
    figures: [], // { id, number, caption, filename, filepath }
    tables: [], // { id, number, caption, data }
    config: {
        preset: 'ieee',
        font: 'Times New Roman',
        title_size: 24,
        margins: { top: 0.75, bottom: 1.0, left: 0.63, right: 0.63 }
    },
    currentAiSectionId: null,
    currentAiSuggestion: null
};

function init() {
    // copy default array safely
    state.sections = JSON.parse(JSON.stringify(DEFAULT_IEEE_SECTIONS));
    renderSections();
    setupEventListeners();
    updateThemeIcon();
}

function renderSections() {
    const container = document.getElementById("sections-container");
    container.innerHTML = "";

    state.sections.forEach((sec, index) => {
        const div = document.createElement("div");
        div.className = "section-box";
        div.setAttribute("data-id", sec.id);

        div.innerHTML = `
            <div class="section-header">
                <input type="text" class="section-title-input" value="${sec.name}" data-id="${sec.id}" placeholder="Section Title">
                <div class="section-actions">
                    <button class="icon-btn move-up-btn" data-id="${sec.id}" title="Move Up"><i class="fas fa-arrow-up"></i></button>
                    <button class="icon-btn move-down-btn" data-id="${sec.id}" title="Move Down"><i class="fas fa-arrow-down"></i></button>
                    <button class="icon-btn delete-btn" data-id="${sec.id}" title="Delete Section"><i class="fas fa-trash"></i></button>
                    <div class="ai-controls">
                        <select id="action-${sec.id}">
                            <option value="verify_and_clean">Verify & Clean format (Math/Titles)</option>
                            <option value="fix_grammar">Fix Grammar</option>
                            <option value="make_longer">Make Longer</option>
                            <option value="make_shorter">Make Shorter</option>
                        </select>
                        <button class="primary-btn btn-small ai-btn" data-id="${sec.id}">Ask AI</button>
                    </div>
                </div>
            </div>
            <textarea class="content-input" data-id="${sec.id}" placeholder="Enter ${sec.name} content... Use [FIGURE 1] inside text to place figures.">${sec.content}</textarea>
            <div class="section-footer">
                <span class="word-count" id="wc-${sec.id}">Words: ${getWordCount(sec.content)}</span>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderFigures() {
    const ul = document.getElementById("figures-list");
    ul.innerHTML = "";
    state.figures.forEach(fig => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span><strong>Fig ${fig.figure_number}:</strong> ${fig.caption}</span>
            <div class="item-actions">
                <button class="icon-btn delete-fig-btn" data-id="${fig.id}" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        `;
        ul.appendChild(li);
    });
}

function renderTables() {
    const ul = document.getElementById("tables-list");
    ul.innerHTML = "";
    state.tables.forEach(tab => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span><strong>Table ${tab.number}:</strong> ${tab.caption}</span>
            <div class="item-actions">
                <button class="icon-btn delete-tab-btn" data-id="${tab.id}" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
        `;
        ul.appendChild(li);
    });
}

function getWordCount(text) {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function setupEventListeners() {
    // Theme toggle
    document.getElementById("theme-toggle").addEventListener("click", () => {
        const currentTheme = document.body.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        document.body.setAttribute("data-theme", newTheme);
        updateThemeIcon();
    });

    // Preset dropdown
    document.getElementById("preset").addEventListener("change", (e) => {
        state.config.preset = e.target.value;
        if (e.target.value === "custom") {
            document.getElementById("custom-preset-modal").classList.remove("hidden");
        } else {
            // Revert to IEEE default config
            state.config.font = 'Times New Roman';
            state.config.title_size = 24;
            state.config.margins = { top: 0.75, bottom: 1.0, left: 0.63, right: 0.63 };
        }
    });

    // Custom Preset logic
    document.getElementById("close-preset-modal").addEventListener("click", () => {
        document.getElementById("custom-preset-modal").classList.add("hidden");
    });

    document.getElementById("apply-base-preset").addEventListener("click", () => {
        const base = document.getElementById("load-base-preset").value;
        if (base === "ieee") {
            document.getElementById("custom-font").value = "Times New Roman";
            document.getElementById("margin-top").value = "0.75";
            document.getElementById("margin-bottom").value = "1.0";
            document.getElementById("margin-left").value = "0.63";
            document.getElementById("margin-right").value = "0.63";
            state.sections = JSON.parse(JSON.stringify(DEFAULT_IEEE_SECTIONS));
            renderSections();
        } else {
            document.getElementById("custom-font").value = "Arial";
            state.sections = [{ id: generateId(), name: "Body", content: "" }];
            renderSections();
        }
    });

    document.getElementById("save-preset").addEventListener("click", () => {
        state.config.font = document.getElementById("custom-font").value;
        state.config.title_size = parseInt(document.getElementById("title-size").value) || 24;
        state.config.margins = {
            top: parseFloat(document.getElementById("margin-top").value),
            bottom: parseFloat(document.getElementById("margin-bottom").value),
            left: parseFloat(document.getElementById("margin-left").value),
            right: parseFloat(document.getElementById("margin-right").value),
        };
        document.getElementById("custom-preset-modal").classList.add("hidden");
    });

    // Sections interaction
    const container = document.getElementById("sections-container");

    // Title & Content tracking
    container.addEventListener("input", (e) => {
        if (e.target.classList.contains("section-title-input")) {
            const id = e.target.getAttribute("data-id");
            const sec = state.sections.find(s => s.id === id);
            if (sec) sec.name = e.target.value;
        }
        else if (e.target.classList.contains("content-input")) {
            const id = e.target.getAttribute("data-id");
            const sec = state.sections.find(s => s.id === id);
            if (sec) {
                sec.content = e.target.value;
                document.getElementById(`wc-${id}`).textContent = `Words: ${getWordCount(sec.content)}`;
            }
        }
    });

    // Add Section button
    document.getElementById("add-section-btn").addEventListener("click", () => {
        state.sections.push({ id: generateId(), name: "New Section", content: "" });
        renderSections();
        // Scroll to bottom safely
        document.querySelector('.left-panel').scrollTop = document.querySelector('.left-panel').scrollHeight;
    });

    // Actions (Move up, down, delete, AI)
    container.addEventListener("click", async (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;

        const id = btn.getAttribute("data-id");
        const index = state.sections.findIndex(s => s.id === id);

        if (btn.classList.contains("delete-btn")) {
            if (confirm("Remove this section entirely?")) {
                state.sections.splice(index, 1);
                renderSections();
            }
        }
        else if (btn.classList.contains("move-up-btn")) {
            if (index > 0) {
                [state.sections[index - 1], state.sections[index]] = [state.sections[index], state.sections[index - 1]];
                renderSections();
            }
        }
        else if (btn.classList.contains("move-down-btn")) {
            if (index < state.sections.length - 1) {
                [state.sections[index + 1], state.sections[index]] = [state.sections[index], state.sections[index + 1]];
                renderSections();
            }
        }
        else if (btn.classList.contains("ai-btn")) {
            const sec = state.sections[index];
            const action = document.getElementById(`action-${id}`).value;

            if (!sec.content.trim()) return alert("Enter content first.");

            btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Hmm...`;
            btn.disabled = true;

            try {
                const res = await fetch(`${API_BASE}/refine`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        section_name: sec.name,
                        text: sec.content,
                        action: action
                    })
                });
                const data = await res.json();

                state.currentAiSectionId = id;
                state.currentAiSuggestion = data.suggested_text;

                document.getElementById("ai-suggested-text").value = data.suggested_text;
                document.getElementById("ai-modal").classList.remove("hidden");
            } catch (err) {
                alert("Failed to reach AI.");
            } finally {
                btn.innerHTML = "Ask AI";
                btn.disabled = false;
            }
        }
    });

    // AI Accept / Reject
    document.getElementById("accept-ai").addEventListener("click", () => {
        if (state.currentAiSectionId && state.currentAiSuggestion) {
            const sec = state.sections.find(s => s.id === state.currentAiSectionId);
            if (sec) {
                sec.content = state.currentAiSuggestion;
                // Re-render completely guarantees states sync
                renderSections();
            }
        }
        document.getElementById("ai-modal").classList.add("hidden");
    });

    document.getElementById("close-ai-modal").addEventListener("click", () => {
        document.getElementById("ai-modal").classList.add("hidden");
    });
    document.getElementById("reject-ai").addEventListener("click", () => {
        document.getElementById("ai-modal").classList.add("hidden");
    });

    // Figure Upload
    document.getElementById("fig-file").addEventListener("change", (e) => {
        const name = e.target.files.length ? e.target.files[0].name : "Select Image File...";
        document.getElementById("fig-file-name").textContent = name;
    });

    document.getElementById("figure-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById("fig-file");
        if (!fileInput.files.length) return;

        const formData = new FormData();
        formData.append("file", fileInput.files[0]);
        formData.append("figure_number", document.getElementById("fig-number").value);
        formData.append("caption", document.getElementById("fig-caption").value);
        formData.append("target_section", "None"); // Handled by inline tags now

        const btn = e.target.querySelector("button[type=submit]");
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Uploading...`;
        btn.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/upload_figure`, {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            state.figures.push(data);
            renderFigures();
            e.target.reset();
        } catch (err) {
            alert("Upload failed.");
        } finally {
            btn.innerHTML = `<i class="fas fa-upload"></i> Upload Figure`;
            btn.disabled = false;
            document.getElementById("fig-file-name").textContent = "Select Image File...";
        }
    });

    // Delete Figure
    document.getElementById("figures-list").addEventListener("click", (e) => {
        const btn = e.target.closest(".delete-fig-btn");
        if (btn) {
            const id = btn.getAttribute("data-id");
            state.figures = state.figures.filter(f => f.id !== id);
            renderFigures();
        }
    });

    // --- Table Manager Logic ---
    let selectedRows = 3;
    let selectedCols = 3;
    const gridSelector = document.getElementById("grid-selector");
    const maxGrid = 10;

    // Initialize 10x10 dots
    for (let r = 1; r <= maxGrid; r++) {
        for (let c = 1; c <= maxGrid; c++) {
            const cell = document.createElement("div");
            cell.className = "grid-cell-selector";
            cell.dataset.r = r;
            cell.dataset.c = c;
            gridSelector.appendChild(cell);
        }
    }

    function updateGridVisuals(rTarget, cTarget, action) {
        document.getElementById("grid-size-label").textContent = `${rTarget}x${cTarget}`;
        Array.from(gridSelector.children).forEach(cell => {
            const cr = parseInt(cell.dataset.r);
            const cc = parseInt(cell.dataset.c);
            if (action === 'hover') {
                if (cr <= rTarget && cc <= cTarget) cell.classList.add("hovered");
                else cell.classList.remove("hovered");
            } else {
                cell.classList.remove("hovered");
                if (cr <= selectedRows && cc <= selectedCols) cell.classList.add("selected");
                else cell.classList.remove("selected");
            }
        });
    }

    gridSelector.addEventListener("mouseover", (e) => {
        if (e.target.classList.contains("grid-cell-selector")) {
            updateGridVisuals(parseInt(e.target.dataset.r), parseInt(e.target.dataset.c), 'hover');
        }
    });

    gridSelector.addEventListener("mouseleave", () => {
        updateGridVisuals(selectedRows, selectedCols, 'leave');
    });

    // Trigger initial visual
    updateGridVisuals(selectedRows, selectedCols, 'leave');

    gridSelector.addEventListener("click", (e) => {
        if (e.target.classList.contains("grid-cell-selector")) {
            selectedRows = parseInt(e.target.dataset.r);
            selectedCols = parseInt(e.target.dataset.c);
            updateGridVisuals(selectedRows, selectedCols, 'leave');

            const grid = document.getElementById("tab-grid");
            grid.innerHTML = "";
            grid.style.gridTemplateColumns = `repeat(${selectedCols}, 1fr)`;

            for (let r = 0; r < selectedRows; r++) {
                for (let c = 0; c < selectedCols; c++) {
                    const input = document.createElement("input");
                    input.className = "tab-cell";
                    input.type = "text";
                    input.dataset.r = r;
                    input.dataset.c = c;
                    input.addEventListener("paste", (e) => {
                        e.preventDefault();
                        let pasteData = (e.clipboardData || window.clipboardData).getData("text");
                        let rowsData = pasteData.trim().split(/[\r\n]+/);
                        const cells = Array.from(grid.querySelectorAll(".tab-cell"));
                        for (let i = 0; i < rowsData.length; i++) {
                            let colsData = rowsData[i].split(/\t|,/); // handle tab or comma sep
                            for (let j = 0; j < colsData.length; j++) {
                                const targetRow = r + i;
                                const targetCol = c + j;
                                if (targetRow < selectedRows && targetCol < selectedCols) {
                                    const cellTarget = cells.find(el => parseInt(el.dataset.r) === targetRow && parseInt(el.dataset.c) === targetCol);
                                    if (cellTarget) cellTarget.value = colsData[j].trim();
                                }
                            }
                        }
                    });
                    grid.appendChild(input);
                }
            }
            document.getElementById("table-form").classList.remove("hidden");
        }
    });

    document.getElementById("table-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const num = document.getElementById("tab-number").value;
        const cap = document.getElementById("tab-caption").value;

        // Infer bounds from selected bounds
        const rows = selectedRows;
        const cols = selectedCols;

        let dataGrid = [];
        const cells = Array.from(document.querySelectorAll(".tab-cell"));
        for (let r = 0; r < rows; r++) {
            let rowArr = [];
            for (let c = 0; c < cols; c++) {
                const cellTarget = cells.find(el => parseInt(el.dataset.r) === r && parseInt(el.dataset.c) === c);
                rowArr.push(cellTarget ? cellTarget.value : "");
            }
            dataGrid.push(rowArr);
        }

        state.tables.push({
            id: generateId(),
            number: num,
            caption: cap,
            data: dataGrid
        });

        renderTables();
        document.getElementById("table-form").classList.add("hidden");
        document.getElementById("tab-grid").innerHTML = "";
        e.target.reset();
    });

    // Delete Table
    document.getElementById("tables-list").addEventListener("click", (e) => {
        const btn = e.target.closest(".delete-tab-btn");
        if (btn) {
            const id = btn.getAttribute("data-id");
            state.tables = state.tables.filter(f => f.id !== id);
            renderTables();
        }
    });

    // Export DOCX
    document.getElementById("export-docx-btn").addEventListener("click", async (e) => {
        const btn = e.target;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Generating...`;
        btn.disabled = true;

        const payload = {
            doc_config: state.config,
            sections_list: state.sections,
            figures: state.figures,
            tables: state.tables
        };

        try {
            const res = await fetch(`${API_BASE}/export_docx`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "IEEE_Paper.docx";
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert("Export failed on server.");
            }
        } catch (err) {
            alert("Export failed.");
        } finally {
            btn.innerHTML = `<i class="fas fa-file-export"></i> Export DOCX`;
            btn.disabled = false;
        }
    });
}

function updateThemeIcon() {
    const isDark = document.body.getAttribute("data-theme") === "dark";
    document.getElementById("theme-toggle").innerHTML = isDark ? `<i class="fas fa-sun"></i>` : `<i class="fas fa-moon"></i>`;
}

init();
